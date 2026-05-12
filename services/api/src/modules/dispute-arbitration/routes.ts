// ═══════════════════════════════════════════════════════════════════
// Dispute Arbitration — Officer routing disputes + boundary training
// ═══════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../db/supabase-client';
import { requireRole } from '../../gateway/auth-middleware';
import { OfficerRole } from '../../types';

async function getOfficerDisputes(req: Request, res: Response) {
  const officerId = req.user!.officer_id;
  const { data } = await supabaseAdmin.from('routing_errors')
    .select('*').eq('disputed_by', officerId)
    .order('created_at', { ascending: false });
  res.json({ disputes: data || [] });
}

async function getDisputeHeatmap(_req: Request, res: Response) {
  const { data } = await supabaseAdmin.from('routing_errors')
    .select('original_ward_id, corrected_ward_id, created_at');

  // Group by ward pair for heatmap
  const heatmap: Record<string, number> = {};
  (data || []).forEach((d) => {
    const key = `${d.original_ward_id}->${d.corrected_ward_id}`;
    heatmap[key] = (heatmap[key] || 0) + 1;
  });

  res.json({ heatmap, total_disputes: data?.length || 0 });
}

async function getOfficersNeedingTraining(_req: Request, res: Response) {
  // Officers with 5+ disputes need boundary training
  const { data } = await supabaseAdmin.from('routing_errors').select('disputed_by');

  const counts: Record<string, number> = {};
  (data || []).forEach((d) => { counts[d.disputed_by] = (counts[d.disputed_by] || 0) + 1; });

  const needsTraining = Object.entries(counts)
    .filter(([, count]) => count >= 5)
    .map(([officer_id, count]) => ({ officer_id, dispute_count: count }));

  res.json({ officers_needing_training: needsTraining });
}

export const disputeRouter = Router();
disputeRouter.get('/my-disputes', requireRole(OfficerRole.OFFICER), getOfficerDisputes);
disputeRouter.get('/heatmap', requireRole(OfficerRole.SUPERVISOR, OfficerRole.ADMIN, OfficerRole.GIS_OFFICER), getDisputeHeatmap);
disputeRouter.get('/training-needed', requireRole(OfficerRole.SUPERVISOR, OfficerRole.ADMIN), getOfficersNeedingTraining);

