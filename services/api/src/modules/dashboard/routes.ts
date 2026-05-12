// ═══════════════════════════════════════════════════════════════════
// Dashboard — Three-track accountability + stats
// Track 1: Officer | Track 2: Contractor | Track 3: Department
// ═══════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../db/supabase-client';
import { requireRole } from '../../gateway/auth-middleware';
import { OfficerRole } from '../../types';

async function getOverviewStats(_req: Request, res: Response) {
  const { count: total } = await supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true });
  const { count: resolved } = await supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'RESOLVED');
  const { count: pending } = await supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }).in('status', ['NEW', 'ROUTED', 'ASSIGNED', 'IN_PROGRESS']);

  // By category
  let byCat = null;
  try {
    const { data } = await supabaseAdmin.rpc('count_by_category');
    byCat = data;
  } catch (err) {
    // Fallback handled below
  }
  // Fallback
  const categories: Record<string, number> = {};
  if (!byCat) {
    for (const cat of ['ROADS', 'SANITATION', 'WATER', 'ELECTRICITY', 'OTHER']) {
      const { count } = await supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }).eq('category', cat);
      categories[cat] = count || 0;
    }
  }

  // By ward
  const { data: wards } = await supabaseAdmin.from('wards').select('id, name');
  const byWard = [];
  for (const w of (wards || [])) {
    const { count } = await supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }).eq('ward_id', w.id);
    byWard.push({ ward_id: w.id, ward_name: w.name, count: count || 0 });
  }

  res.json({
    total_complaints: total || 0,
    resolved_count: resolved || 0,
    pending_count: pending || 0,
    avg_resolution_hours: 0, // Calculated via materialized view in production
    sla_breach_rate: 0,
    complaints_by_category: byCat || categories,
    complaints_by_ward: byWard,
  });
}

// Track 1: Officer performance
async function getOfficerPerformance(req: Request, res: Response) {
  const { data: officers } = await supabaseAdmin.from('officers').select('id, name, ward_id, role').eq('role', 'OFFICER');
  const results = [];

  for (const officer of (officers || [])) {
    const { count: resolved } = await supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }).eq('closed_by', officer.id).eq('status', 'RESOLVED');
    const { count: reopened } = await supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }).eq('closed_by', officer.id).eq('status', 'REOPENED');
    const { data: fraud } = await supabaseAdmin.from('fraud_scores').select('tier, score').eq('officer_id', officer.id).order('created_at', { ascending: false }).limit(1).single();

    results.push({
      officer_id: officer.id, officer_name: officer.name,
      resolved_count: resolved || 0,
      reopen_rate: resolved ? (reopened || 0) / resolved : 0,
      fraud_tier: fraud?.tier || 'CLEAN',
      avg_resolution_hours: 0,
      sla_breach_rate: 0,
      capacity_adjusted_score: 0,
    });
  }

  res.json({ officers: results });
}

// Track 2: Contractor performance
async function getContractorPerformance(_req: Request, res: Response) {
  const { data: contractors } = await supabaseAdmin.from('contractors').select('*');
  res.json({ contractors: contractors || [] });
}

// Track 3: Department performance
async function getDepartmentPerformance(_req: Request, res: Response) {
  const { data: blocking } = await supabaseAdmin.from('complaint_dependencies').select('blocking_department').is('resolved_at', null);

  const deptBlocking: Record<string, number> = {};
  (blocking || []).forEach((b) => { deptBlocking[b.blocking_department] = (deptBlocking[b.blocking_department] || 0) + 1; });

  const { data: multiOwner } = await supabaseAdmin.from('multi_owner_assignments')
    .select('department, status');

  const deptStats: Record<string, { total: number; resolved: number; blocked: number }> = {};
  (multiOwner || []).forEach((m) => {
    if (!deptStats[m.department]) deptStats[m.department] = { total: 0, resolved: 0, blocked: 0 };
    deptStats[m.department].total++;
    if (m.status === 'RESOLVED') deptStats[m.department].resolved++;
    if (m.status === 'BLOCKED') deptStats[m.department].blocked++;
  });

  res.json({ department_blocking: deptBlocking, department_stats: deptStats });
}

export const dashboardRouter = Router();
dashboardRouter.get('/stats', requireRole(OfficerRole.SUPERVISOR, OfficerRole.ADMIN, OfficerRole.ZONAL_COMMISSIONER), getOverviewStats);
dashboardRouter.get('/officers', requireRole(OfficerRole.SUPERVISOR, OfficerRole.ADMIN), getOfficerPerformance);
dashboardRouter.get('/contractors', requireRole(OfficerRole.SUPERVISOR, OfficerRole.ADMIN), getContractorPerformance);
dashboardRouter.get('/departments', requireRole(OfficerRole.SUPERVISOR, OfficerRole.ADMIN, OfficerRole.ZONAL_COMMISSIONER), getDepartmentPerformance);

