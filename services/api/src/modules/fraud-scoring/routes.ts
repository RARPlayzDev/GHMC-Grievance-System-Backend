// ═══════════════════════════════════════════════════════════════════
// Fraud Scoring Module — Routes + scoring endpoint
// ═══════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../db/supabase-client';
import { calculateFraudScore } from '../../ai/fraud-rules';
import { requireRole } from '../../gateway/auth-middleware';
import { OfficerRole } from '../../types';
import { criticalEvents } from '../../lib/logger';

async function runFraudScoring(req: Request, res: Response) {
  const { complaint_id, officer_id, closure_verification_score, closure_location, filed_location, capacity_constrained } = req.body;

  const result = await calculateFraudScore({
    complaint_id, officer_id,
    closure_verification_score,
    closure_photo_location: closure_location,
    filed_location,
    closure_time: new Date(),
    capacity_constrained,
  });

  // Store fraud score
  await supabaseAdmin.from('fraud_scores').insert({
    complaint_id, officer_id,
    score: result.score,
    tier: result.tier,
    signals: result.signals,
    excluded: result.excluded,
    exclusion_reason: result.exclusion_reason,
  });

  if (result.tier !== 'CLEAN') {
    criticalEvents.fraudScoreElevated(officer_id, result.score, result.tier);
  }

  // Log action
  await supabaseAdmin.from('action_logs').insert({
    complaint_id, officer_id,
    action_type: 'FRAUD_SCORE_CALCULATED',
    metadata: { score: result.score, tier: result.tier, excluded: result.excluded },
  });

  res.json(result);
}

async function getOfficerFraudHistory(req: Request, res: Response) {
  const { officer_id } = req.params;
  const { data } = await supabaseAdmin.from('fraud_scores')
    .select('*').eq('officer_id', officer_id)
    .order('created_at', { ascending: false }).limit(50);
  res.json({ scores: data || [] });
}

async function getFraudScoresByTier(req: Request, res: Response) {
  const tier = req.query.tier as string;
  let query = supabaseAdmin.from('fraud_scores').select('*').order('created_at', { ascending: false });
  if (tier) query = query.eq('tier', tier);
  const { data } = await query.limit(100);
  res.json({ scores: data || [] });
}

export const fraudRouter = Router();
fraudRouter.post('/score', requireRole(OfficerRole.ADMIN), runFraudScoring);
fraudRouter.get('/officer/:officer_id', requireRole(OfficerRole.SUPERVISOR, OfficerRole.ADMIN), getOfficerFraudHistory);
fraudRouter.get('/', requireRole(OfficerRole.SUPERVISOR, OfficerRole.ADMIN), getFraudScoresByTier);

