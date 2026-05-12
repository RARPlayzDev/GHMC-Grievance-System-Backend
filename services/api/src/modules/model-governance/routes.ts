// ═══════════════════════════════════════════════════════════════════
// Model Governance — Governed retraining with audit + rollback
// ═══════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../db/supabase-client';
import { requireRole } from '../../gateway/auth-middleware';
import { OfficerRole } from '../../types';

async function listGovernanceLogs(_req: Request, res: Response) {
  const { data } = await supabaseAdmin.from('model_governance_log')
    .select('*').order('created_at', { ascending: false }).limit(50);
  res.json({ logs: data || [] });
}

async function createRetrainingRequest(req: Request, res: Response) {
  const { model_name, version_from, version_to, accuracy_delta, validation_report } = req.body;

  const { data, error } = await supabaseAdmin.from('model_governance_log').insert({
    model_name, version_from, version_to,
    accuracy_delta, validation_report,
    status: 'PENDING',
  }).select().single();

  if (error) throw new Error(error.message);

  await supabaseAdmin.from('action_logs').insert({
    complaint_id: null, officer_id: req.user!.officer_id,
    action_type: 'MODEL_RETRAIN_REQUESTED',
    metadata: { model_name, version_to, accuracy_delta },
  });

  res.status(201).json(data);
}

async function approveRetraining(req: Request, res: Response) {
  const { id } = req.params;
  const { data: log } = await supabaseAdmin.from('model_governance_log').select('*').eq('id', id).single();
  if (!log) { res.status(404).json({ error: 'NOT_FOUND', status: 404 }); return; }

  // Check accuracy delta is positive or neutral
  if (log.accuracy_delta < 0) {
    res.status(400).json({ error: 'ACCURACY_DEGRADATION', message: 'Cannot approve model with negative accuracy delta', status: 400 }); return;
  }

  await supabaseAdmin.from('model_governance_log').update({
    status: 'APPROVED',
    approved_by: req.user!.officer_id,
    approved_at: new Date().toISOString(),
  }).eq('id', id);

  res.json({ message: 'Retraining approved', id });
}

async function rollbackModel(req: Request, res: Response) {
  const { id } = req.params;
  await supabaseAdmin.from('model_governance_log').update({
    status: 'ROLLED_BACK',
  }).eq('id', id);

  await supabaseAdmin.from('action_logs').insert({
    complaint_id: null, officer_id: req.user!.officer_id,
    action_type: 'MODEL_ROLLED_BACK',
    metadata: { governance_log_id: id },
  });

  res.json({ message: 'Model rolled back', id });
}

export const modelGovernanceRouter = Router();
modelGovernanceRouter.get('/', requireRole(OfficerRole.IT_HEAD, OfficerRole.ADMIN), listGovernanceLogs);
modelGovernanceRouter.post('/request', requireRole(OfficerRole.IT_HEAD, OfficerRole.ADMIN), createRetrainingRequest);
modelGovernanceRouter.post('/:id/approve', requireRole(OfficerRole.IT_HEAD), approveRetraining);
modelGovernanceRouter.post('/:id/rollback', requireRole(OfficerRole.IT_HEAD, OfficerRole.ADMIN), rollbackModel);

