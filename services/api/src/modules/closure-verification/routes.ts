// ═══════════════════════════════════════════════════════════════════
// Closure Verification — Photo-diff, challenge window, fraud scoring
// ═══════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { supabaseAdmin } from '../../db/supabase-client';
import { ComplaintStatus } from '../../types';
import { verifyPhotoDiff } from '../../ai/photo-diff';
import { calculateFraudScore } from '../../ai/fraud-rules';
import { isFeatureEnabled } from '../../config';
import { storage } from '../../storage/supabase-storage';
import { requireRole } from '../../gateway/auth-middleware';
import { OfficerRole } from '../../types';
import { queue, QUEUE_NAMES } from '../../queue/memory-queue';
import { logger } from '../../lib/logger';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const CloseSchema = z.object({
  closure_location: z.object({ lat: z.number(), lng: z.number() }),
  notes: z.string().optional(),
});

async function closeComplaint(req: Request, res: Response) {
  const { id } = req.params;
  let body = req.body;
  if (typeof body.closure_location === 'string') body.closure_location = JSON.parse(body.closure_location);
  const dto = CloseSchema.parse(body);

  // Get complaint
  const { data: complaint } = await supabaseAdmin.from('complaints').select('*').eq('id', id).single();
  if (!complaint) { res.status(404).json({ error: 'NOT_FOUND', message: 'Complaint not found', status: 404 }); return; }

  // Check assignment
  if (complaint.assigned_officer_id !== req.user!.officer_id) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Not assigned to this officer', status: 403 }); return;
  }

  // Multi-owner check: all departments must be resolved
  if (complaint.is_multi_owner) {
    const { data: pending } = await supabaseAdmin.from('multi_owner_assignments')
      .select('*').eq('complaint_id', id).neq('status', 'RESOLVED');
    if (pending && pending.length > 0) {
      res.status(409).json({ error: 'MULTI_OWNER_PENDING', message: 'Other departments have not completed their work', status: 409, details: { pending_departments: pending.map(p => p.department) } }); return;
    }
  }

  // Upload after-photo
  const file = (req.file as Express.Multer.File) || (req.files as Express.Multer.File[])?.[0];
  let closurePhotoUrl: string | null = null;
  if (file) {
    closurePhotoUrl = await storage.uploadPhoto(file.buffer, file.mimetype);
  }

  // Photo-diff verification (Phase 3+)
  let verificationScore: number | null = null;
  if (isFeatureEnabled('photo_diff') && closurePhotoUrl && complaint.photos?.length > 0) {
    try {
      const afterBase64 = file!.buffer.toString('base64');
      const result = await verifyPhotoDiff(complaint.photos[0], afterBase64);
      verificationScore = result.closure_verification_score;
    } catch (err) {
      logger.warn('Photo-diff verification failed', { error: (err as Error).message });
    }
  }

  // Update complaint
  const newStatus = verificationScore !== null && verificationScore < 0.4
    ? ComplaintStatus.IN_PROGRESS // Verification failed — don't close
    : ComplaintStatus.PENDING_CITIZEN_VERIFICATION;

  await supabaseAdmin.from('complaints').update({
    status: newStatus,
    closure_photo_url: closurePhotoUrl,
    closure_photo_location: dto.closure_location as any,
    closure_verification_score: verificationScore,
    closed_at: new Date().toISOString(),
    closed_by: req.user!.officer_id,
    updated_at: new Date().toISOString(),
  }).eq('id', id);

  // Log action
  await supabaseAdmin.from('action_logs').insert({
    complaint_id: id, officer_id: req.user!.officer_id,
    action_type: 'CLOSURE_ATTEMPTED',
    metadata: { verification_score: verificationScore, notes: dto.notes },
  });

  // Fraud scoring (Phase 3+)
  if (isFeatureEnabled('fraud_scoring')) {
    await queue.addJob(QUEUE_NAMES.FRAUD_SCORING, {
      complaint_id: id, officer_id: req.user!.officer_id,
      closure_verification_score: verificationScore,
      closure_location: dto.closure_location,
      filed_location: complaint.filed_location,
      capacity_constrained: complaint.capacity_constrained,
    });
  }

  // Notification — 48-hour citizen challenge window starts
  await queue.addJob(QUEUE_NAMES.NOTIFICATION, {
    complaint_id: id, type: 'CLOSURE_VERIFICATION', status: newStatus,
  });

  res.json({ message: 'Closure initiated', status: newStatus, verification_score: verificationScore });
}

// Citizen challenge endpoint
async function challengeClosure(req: Request, res: Response) {
  const { id } = req.params;
  const { reason } = z.object({ reason: z.string().min(5) }).parse(req.body);

  const { data: complaint } = await supabaseAdmin.from('complaints').select('*').eq('id', id).single();
  if (!complaint) { res.status(404).json({ error: 'NOT_FOUND', message: 'Complaint not found', status: 404 }); return; }
  if (complaint.status !== ComplaintStatus.PENDING_CITIZEN_VERIFICATION) {
    res.status(400).json({ error: 'INVALID_STATE', message: 'Complaint is not in verification state', status: 400 }); return;
  }

  // Reopen the complaint
  const reopenCount = await supabaseAdmin.from('action_logs')
    .select('*', { count: 'exact', head: true })
    .eq('complaint_id', id).eq('action_type', 'CITIZEN_CHALLENGE');

  const newStatus = (reopenCount.count || 0) >= 2 ? ComplaintStatus.ESCALATED : ComplaintStatus.REOPENED;

  await supabaseAdmin.from('complaints').update({
    status: newStatus, updated_at: new Date().toISOString(),
  }).eq('id', id);

  await supabaseAdmin.from('action_logs').insert({
    complaint_id: id, action_type: 'CITIZEN_CHALLENGE',
    metadata: { reason, challenge_number: (reopenCount.count || 0) + 1 },
  });

  res.json({ message: 'Closure challenged', new_status: newStatus });
}

// Auto-resolve after 48 hours with no challenge
async function autoResolveExpired(_req: Request, res: Response) {
  const cutoff = new Date(Date.now() - 48 * 3600000).toISOString();
  const { data: pending } = await supabaseAdmin.from('complaints')
    .select('id').eq('status', ComplaintStatus.PENDING_CITIZEN_VERIFICATION)
    .lte('closed_at', cutoff);

  let resolved = 0;
  for (const c of (pending || [])) {
    await supabaseAdmin.from('complaints').update({
      status: ComplaintStatus.RESOLVED, updated_at: new Date().toISOString(),
    }).eq('id', c.id);
    await supabaseAdmin.from('action_logs').insert({
      complaint_id: c.id, action_type: 'AUTO_RESOLVED_48H',
    });
    resolved++;
  }

  res.json({ resolved });
}

export const closureRouter = Router();
closureRouter.post('/:id/close', requireRole(OfficerRole.OFFICER, OfficerRole.SUPERVISOR), upload.single('after_photo'), closeComplaint);
closureRouter.post('/:id/challenge', challengeClosure); // Anonymous — citizen
closureRouter.post('/auto-resolve', requireRole(OfficerRole.ADMIN), autoResolveExpired);

