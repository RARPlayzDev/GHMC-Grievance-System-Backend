// ═══════════════════════════════════════════════════════════════════
// Ward Routing — Module (routes + controller + service + repository)
// Handles routing disputes and GIS governance
// ═══════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../db/supabase-client';
import { resolveWard } from '../../ai/ward-routing-nlp';
import { requireRole } from '../../gateway/auth-middleware';
import { OfficerRole } from '../../types';

// ──────── Repository ────────

async function getWards() {
  const { data } = await supabaseAdmin.from('wards').select('*');
  return data || [];
}

async function getWardById(id: string) {
  const { data } = await supabaseAdmin.from('wards').select('*').eq('id', id).single();
  return data;
}

async function insertRoutingError(data: any) {
  const { data: err, error } = await supabaseAdmin.from('routing_errors').insert(data).select().single();
  if (error) throw new Error(`Insert routing error: ${error.message}`);
  return err;
}

async function getRoutingErrors(wardId?: string) {
  let query = supabaseAdmin.from('routing_errors').select('*').order('created_at', { ascending: false });
  if (wardId) query = query.eq('original_ward_id', wardId);
  const { data } = await query.limit(100);
  return data || [];
}

// ──────── Controller ────────

const DisputeSchema = z.object({
  complaint_id: z.string().uuid(),
  reason: z.string().min(5).max(500),
});

async function disputeRouting(req: Request, res: Response) {
  const dto = DisputeSchema.parse(req.body);

  // Get the complaint
  const { data: complaint } = await supabaseAdmin.from('complaints').select('*').eq('id', dto.complaint_id).single();
  if (!complaint) { res.status(404).json({ error: 'NOT_FOUND', message: 'Complaint not found', status: 404 }); return; }

  // AI re-arbitration
  const newRouting = await resolveWard(complaint.filed_location, complaint.description);

  // Log the routing error (immutable)
  const routingError = await insertRoutingError({
    complaint_id: dto.complaint_id,
    original_ward_id: complaint.ward_id,
    disputed_by: req.user!.officer_id,
    corrected_ward_id: newRouting.ward_id,
    resolution_method: `AI_RE_ARBITRATION (confidence: ${newRouting.confidence})`,
  });

  // Update complaint if AI is confident enough
  if (newRouting.confidence > 0.7 && newRouting.ward_id !== complaint.ward_id) {
    await supabaseAdmin.from('complaints').update({
      ward_id: newRouting.ward_id,
      routing_confidence_score: newRouting.confidence,
      routing_method: newRouting.method,
      updated_at: new Date().toISOString(),
    }).eq('id', dto.complaint_id);
  }

  // Log action
  await supabaseAdmin.from('action_logs').insert({
    complaint_id: dto.complaint_id,
    officer_id: req.user!.officer_id,
    action_type: 'ROUTING_DISPUTED',
    metadata: { reason: dto.reason, new_ward: newRouting.ward_id, confidence: newRouting.confidence },
  });

  res.json({ routing_error: routingError, new_routing: newRouting });
}

async function listWards(_req: Request, res: Response) {
  const wards = await getWards();
  res.json({ wards });
}

async function listRoutingErrors(req: Request, res: Response) {
  const errors = await getRoutingErrors(req.query.ward_id as string);
  res.json({ routing_errors: errors });
}

// ──────── Routes ────────

export const routingRouter = Router();
routingRouter.get('/wards', listWards);
routingRouter.post('/dispute', requireRole(OfficerRole.OFFICER, OfficerRole.SUPERVISOR), disputeRouting);
routingRouter.get('/errors', requireRole(OfficerRole.SUPERVISOR, OfficerRole.ADMIN, OfficerRole.GIS_OFFICER), listRoutingErrors);

