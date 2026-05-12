// ═══════════════════════════════════════════════════════════════════
// Chronic Site Detection — Geohash clustering + cause-aware escalation
// 4 escalation paths: officer, contractor, interdept, capacity
// ═══════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../db/supabase-client';
import { requireRole } from '../../gateway/auth-middleware';
import { OfficerRole, ChronicSiteEscalation } from '../../types';

async function detectChronicSites(_req: Request, res: Response) {
  // Find locations with 3+ closure-reopen cycles in 90 days
  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();

  const { data: reopened } = await supabaseAdmin.from('complaints')
    .select('id, geohash, category, ward_id, status')
    .in('status', ['REOPENED', 'ESCALATED'])
    .gte('created_at', cutoff);

  if (!reopened || reopened.length === 0) { res.json({ detected: 0, sites: [] }); return; }

  // Group by geohash-5 prefix + category
  const groups: Record<string, { count: number; ids: string[]; category: string; geohash: string }> = {};
  for (const c of reopened) {
    const key = `${c.geohash?.substring(0, 5)}_${c.category}`;
    if (!groups[key]) groups[key] = { count: 0, ids: [], category: c.category, geohash: c.geohash?.substring(0, 5) || '' };
    groups[key].count++;
    groups[key].ids.push(c.id);
  }

  const chronicSites = Object.values(groups).filter((g) => g.count >= 3);
  let detected = 0;

  for (const site of chronicSites) {
    // Determine escalation path based on closure failure cause
    const escalation = await determineEscalationPath(site.ids);

    // Upsert chronic site
    await supabaseAdmin.from('chronic_sites').upsert({
      geohash: site.geohash,
      category: site.category,
      cycle_count: site.count,
      complaint_ids: site.ids,
      escalation_path: escalation,
      detected_at: new Date().toISOString(),
    }, { onConflict: 'geohash,category' });

    detected++;
  }

  res.json({ detected, sites: chronicSites });
}

async function determineEscalationPath(complaintIds: string[]): Promise<ChronicSiteEscalation> {
  // Check fraud scores for these complaints
  const { data: fraudScores } = await supabaseAdmin.from('fraud_scores')
    .select('tier, excluded, exclusion_reason')
    .in('complaint_id', complaintIds);

  // Check contractor non-performance
  const { count: contractorFailures } = await supabaseAdmin.from('contractor_nonperformance_log')
    .select('*', { count: 'exact', head: true })
    .in('complaint_id', complaintIds);

  // Check multi-owner blocking
  const { count: deptBlocking } = await supabaseAdmin.from('complaint_dependencies')
    .select('*', { count: 'exact', head: true })
    .in('complaint_id', complaintIds)
    .is('resolved_at', null);

  // Check capacity constraints
  const { data: constrained } = await supabaseAdmin.from('complaints')
    .select('capacity_constrained')
    .in('id', complaintIds)
    .eq('capacity_constrained', true);

  // Determine root cause (highest signal wins)
  if ((contractorFailures || 0) > complaintIds.length * 0.5) return ChronicSiteEscalation.CONTRACTOR_SCORECARD_FLAG;
  if ((deptBlocking || 0) > 0) return ChronicSiteEscalation.INTERDEPT_ZONAL_ESCALATION;
  if ((constrained?.length || 0) > complaintIds.length * 0.5) return ChronicSiteEscalation.CAPACITY_BUDGET_REQUEST;
  return ChronicSiteEscalation.OFFICER_GRADUATED_SUPERVISION;
}

async function listChronicSites(req: Request, res: Response) {
  const { data } = await supabaseAdmin.from('chronic_sites').select('*').order('cycle_count', { ascending: false });
  res.json({ sites: data || [] });
}

async function getChronicSite(req: Request, res: Response) {
  const { data } = await supabaseAdmin.from('chronic_sites').select('*').eq('id', req.params.id).single();
  if (!data) { res.status(404).json({ error: 'NOT_FOUND', status: 404 }); return; }
  res.json(data);
}

export const chronicSiteRouter = Router();
chronicSiteRouter.post('/detect', requireRole(OfficerRole.ADMIN), detectChronicSites);
chronicSiteRouter.get('/', requireRole(OfficerRole.SUPERVISOR, OfficerRole.ADMIN), listChronicSites);
chronicSiteRouter.get('/:id', requireRole(OfficerRole.SUPERVISOR, OfficerRole.ADMIN), getChronicSite);

