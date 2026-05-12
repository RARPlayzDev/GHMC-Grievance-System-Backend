// ═══════════════════════════════════════════════════════════════════
// GIS Governance — Ward boundary management + signed updates
// ═══════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../db/supabase-client';
import { requireRole } from '../../gateway/auth-middleware';
import { OfficerRole } from '../../types';

async function listWards(_req: Request, res: Response) {
  const { data } = await supabaseAdmin.from('wards').select('id, name, zone_id, metadata, created_at, updated_at');
  res.json({ wards: data || [] });
}

async function updateWardBoundary(req: Request, res: Response) {
  const { id } = req.params;
  const { boundary, metadata } = req.body;

  // Log the boundary update (immutable — GIS governance)
  await supabaseAdmin.from('action_logs').insert({
    complaint_id: null, officer_id: req.user!.officer_id,
    action_type: 'WARD_BOUNDARY_UPDATED',
    metadata: { ward_id: id, updated_by: req.user!.officer_id, timestamp: new Date().toISOString() },
  });

  const { data, error } = await supabaseAdmin.from('wards').update({
    boundary, metadata, updated_at: new Date().toISOString(),
  }).eq('id', id).select().single();

  if (error) throw new Error(error.message);
  res.json(data);
}

async function getWardStats(req: Request, res: Response) {
  const { id } = req.params;
  const { count: total } = await supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }).eq('ward_id', id);
  const { count: resolved } = await supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }).eq('ward_id', id).eq('status', 'RESOLVED');
  const { count: pending } = await supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }).eq('ward_id', id).in('status', ['NEW', 'ROUTED', 'ASSIGNED', 'IN_PROGRESS']);
  const { count: routingErrors } = await supabaseAdmin.from('routing_errors').select('*', { count: 'exact', head: true }).eq('original_ward_id', id);

  res.json({ ward_id: id, total: total || 0, resolved: resolved || 0, pending: pending || 0, routing_errors: routingErrors || 0 });
}

export const gisRouter = Router();
gisRouter.get('/wards', listWards);
gisRouter.put('/wards/:id/boundary', requireRole(OfficerRole.GIS_OFFICER, OfficerRole.ADMIN), updateWardBoundary);
gisRouter.get('/wards/:id/stats', requireRole(OfficerRole.SUPERVISOR, OfficerRole.ADMIN, OfficerRole.GIS_OFFICER), getWardStats);

