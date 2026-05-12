// ═══════════════════════════════════════════════════════════════════
// Contractor Registry — CRUD + non-performance logging
// ═══════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../db/supabase-client';
import { requireRole } from '../../gateway/auth-middleware';
import { OfficerRole, ContractorFailureType } from '../../types';

const CreateContractorSchema = z.object({
  name: z.string().min(2).max(200),
  categories: z.array(z.string()).min(1),
  ward_ids: z.array(z.string().uuid()).min(1),
  contact_phone: z.string().optional(),
});

const LogNonperformanceSchema = z.object({
  complaint_id: z.string().uuid(),
  contractor_id: z.string().uuid(),
  failure_type: z.nativeEnum(ContractorFailureType),
  notes: z.string().optional(),
});

async function listContractors(req: Request, res: Response) {
  const { data } = await supabaseAdmin.from('contractors').select('*').order('name');
  res.json({ contractors: data || [] });
}

async function createContractor(req: Request, res: Response) {
  const dto = CreateContractorSchema.parse(req.body);
  const { data, error } = await supabaseAdmin.from('contractors').insert(dto).select().single();
  if (error) throw new Error(error.message);
  res.status(201).json(data);
}

async function getContractor(req: Request, res: Response) {
  const { data } = await supabaseAdmin.from('contractors').select('*').eq('id', req.params.id).single();
  if (!data) { res.status(404).json({ error: 'NOT_FOUND', message: 'Contractor not found', status: 404 }); return; }

  // Get non-performance logs
  const { data: logs } = await supabaseAdmin.from('contractor_nonperformance_log')
    .select('*').eq('contractor_id', req.params.id).order('created_at', { ascending: false });

  res.json({ ...data, nonperformance_logs: logs || [] });
}

async function logNonperformance(req: Request, res: Response) {
  const dto = LogNonperformanceSchema.parse(req.body);

  // Upload evidence photo if present
  let evidenceUrl: string | null = null;
  const file = req.file as Express.Multer.File;
  if (file) {
    const { storage } = await import('../../storage/supabase-storage');
    evidenceUrl = await storage.uploadPhoto(file.buffer, file.mimetype);
  }

  const { data, error } = await supabaseAdmin.from('contractor_nonperformance_log').insert({
    ...dto,
    reported_by: req.user!.officer_id,
    evidence_photo_url: evidenceUrl,
  }).select().single();

  if (error) throw new Error(error.message);

  // Update contractor performance score
  const { count: total } = await supabaseAdmin.from('complaints')
    .select('*', { count: 'exact', head: true }).eq('contractor_id', dto.contractor_id);
  const { count: failures } = await supabaseAdmin.from('contractor_nonperformance_log')
    .select('*', { count: 'exact', head: true }).eq('contractor_id', dto.contractor_id);

  const score = total ? Math.max(0, 1 - (failures || 0) / total) : 1;
  await supabaseAdmin.from('contractors').update({ performance_score: parseFloat(score.toFixed(2)) }).eq('id', dto.contractor_id);

  // Log action
  await supabaseAdmin.from('action_logs').insert({
    complaint_id: dto.complaint_id, officer_id: req.user!.officer_id,
    action_type: 'CONTRACTOR_NONPERFORMANCE_LOGGED',
    metadata: { contractor_id: dto.contractor_id, failure_type: dto.failure_type },
  });

  res.status(201).json(data);
}

async function getContractorScorecard(req: Request, res: Response) {
  const { data: contractor } = await supabaseAdmin.from('contractors').select('*').eq('id', req.params.id).single();
  if (!contractor) { res.status(404).json({ error: 'NOT_FOUND', status: 404 }); return; }

  const { count: totalAssignments } = await supabaseAdmin.from('complaints')
    .select('*', { count: 'exact', head: true }).eq('contractor_id', req.params.id);
  const { data: failures } = await supabaseAdmin.from('contractor_nonperformance_log')
    .select('failure_type').eq('contractor_id', req.params.id);

  const failureCounts: Record<string, number> = {};
  (failures || []).forEach((f) => { failureCounts[f.failure_type] = (failureCounts[f.failure_type] || 0) + 1; });

  const { count: chronicCount } = await supabaseAdmin.from('chronic_sites')
    .select('*', { count: 'exact', head: true })
    .eq('escalation_path', 'CONTRACTOR_SCORECARD_FLAG');

  res.json({
    contractor_id: req.params.id,
    contractor_name: contractor.name,
    total_assignments: totalAssignments || 0,
    nonperformance_count: failures?.length || 0,
    failure_types: failureCounts,
    chronic_site_count: chronicCount || 0,
    performance_score: contractor.performance_score,
  });
}

export const contractorRouter = Router();
contractorRouter.get('/', listContractors);
contractorRouter.post('/', requireRole(OfficerRole.ADMIN), createContractor);
contractorRouter.get('/:id', getContractor);
contractorRouter.get('/:id/scorecard', requireRole(OfficerRole.SUPERVISOR, OfficerRole.ADMIN), getContractorScorecard);
contractorRouter.post('/nonperformance', requireRole(OfficerRole.OFFICER, OfficerRole.SUPERVISOR), logNonperformance);

