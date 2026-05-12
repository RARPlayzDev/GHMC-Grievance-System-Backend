// ═══════════════════════════════════════════════════════════════════
// Priority Queue — Dynamic scoring with resource-aware capacity
// Scores: bundle_size, category_urgency, ward_density, time_elapsed,
//         routing_confidence, field_capacity
// ═══════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../db/supabase-client';
import { getUserClient } from '../../db/supabase-client';
import { ComplaintWithPriority, ComplaintStatus } from '../../types';
import { requireRole } from '../../gateway/auth-middleware';
import { OfficerRole } from '../../types';

// Category urgency weights
const URGENCY_WEIGHTS: Record<string, number> = {
  ROADS: 8, SANITATION: 7, WATER: 9, ELECTRICITY: 9, OTHER: 5,
};

// Default SLA hours by category
const SLA_HOURS: Record<string, number> = {
  ROADS: 72, SANITATION: 48, WATER: 24, ELECTRICITY: 12, OTHER: 96,
};

/**
 * Calculate priority score for a complaint.
 * 6 signals: bundle_size, urgency, density, time, confidence, capacity
 */
function calculatePriorityScore(complaint: any, wardDensity: number, resourceAvailable: boolean): number {
  const bundleSignal = Math.min(complaint.bundle_count * 5, 30);       // Max 30
  const urgencySignal = URGENCY_WEIGHTS[complaint.category] || 5;       // Max 10
  const densitySignal = Math.min(wardDensity * 2, 20);                  // Max 20
  const hoursElapsed = (Date.now() - new Date(complaint.created_at).getTime()) / 3600000;
  const timeSignal = Math.min(hoursElapsed * 0.5, 20);                  // Max 20
  const confidenceSignal = (complaint.routing_confidence_score || 0.5) * 10; // Max 10
  const capacityPenalty = resourceAvailable ? 0 : -10;                   // Penalty if constrained

  return bundleSignal + urgencySignal + densitySignal + timeSignal + confidenceSignal + capacityPenalty;
}

async function getOfficerQueue(req: Request, res: Response) {
  const wardId = req.user!.ward_id;
  if (!wardId) { res.status(400).json({ error: 'NO_WARD', message: 'Officer has no assigned ward', status: 400 }); return; }

  // Use user-scoped client for RLS enforcement
  const db = getUserClient(req.accessToken!);
  const statusFilter = req.query.status as string;
  const sortBy = (req.query.sort_by as string) || 'priority';

  let query = db.from('complaints').select('*').eq('ward_id', wardId);

  if (statusFilter && statusFilter !== 'ALL') {
    query = query.eq('status', statusFilter);
  } else {
    query = query.in('status', [ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.ROUTED]);
  }

  const { data: complaints } = await query;
  if (!complaints) { res.json({ complaints: [], queue_length: 0, estimated_workload_hours: 0 }); return; }

  // Get ward density
  const { count: wardTotal } = await supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }).eq('ward_id', wardId);

  // Get resource status
  const { data: resources } = await supabaseAdmin.from('resource_status').select('*').eq('ward_id', wardId).eq('status', 'AVAILABLE');
  const hasResources = (resources?.length || 0) > 0;

  // Score and rank
  const scored: ComplaintWithPriority[] = complaints.map((c, i) => {
    const score = calculatePriorityScore(c, (wardTotal || 0) / 30, hasResources);
    const slaHours = SLA_HOURS[c.category] || 96;
    const slaDeadline = new Date(new Date(c.created_at).getTime() + slaHours * 3600000).toISOString();

    return {
      ...c,
      priority_score: score,
      priority_rank: 0, // Set after sorting
      sla_deadline: slaDeadline,
      capacity_status: {
        is_constrained: !hasResources,
        reason: hasResources ? null : 'Ward resources unavailable',
      },
    };
  });

  // Sort
  scored.sort((a, b) => {
    if (sortBy === 'created_at') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'sla_deadline') return new Date(a.sla_deadline).getTime() - new Date(b.sla_deadline).getTime();
    return (b.priority_score || 0) - (a.priority_score || 0);
  });

  scored.forEach((c, i) => { c.priority_rank = i + 1; });

  // Estimate workload
  const avgHoursPerComplaint = 1.5;
  const estimatedWorkload = scored.length * avgHoursPerComplaint;

  res.json({ complaints: scored, queue_length: scored.length, estimated_workload_hours: estimatedWorkload });
}

async function assignComplaint(req: Request, res: Response) {
  const { id } = req.params;
  const officerId = req.user!.officer_id;

  const { data: complaint } = await supabaseAdmin.from('complaints').select('*').eq('id', id).single();
  if (!complaint) { res.status(404).json({ error: 'NOT_FOUND', message: 'Complaint not found', status: 404 }); return; }

  await supabaseAdmin.from('complaints').update({
    assigned_officer_id: officerId,
    status: ComplaintStatus.ASSIGNED,
    updated_at: new Date().toISOString(),
  }).eq('id', id);

  await supabaseAdmin.from('action_logs').insert({
    complaint_id: id, officer_id: officerId,
    action_type: 'COMPLAINT_ASSIGNED', metadata: { auto: false },
  });

  res.json({ message: 'Complaint assigned', complaint_id: id });
}

async function startResolution(req: Request, res: Response) {
  const { id } = req.params;

  await supabaseAdmin.from('complaints').update({
    status: ComplaintStatus.IN_PROGRESS,
    updated_at: new Date().toISOString(),
  }).eq('id', id);

  await supabaseAdmin.from('action_logs').insert({
    complaint_id: id, officer_id: req.user!.officer_id,
    action_type: 'RESOLUTION_STARTED',
  });

  res.json({ message: 'Resolution started', complaint_id: id });
}

export const priorityQueueRouter = Router();
priorityQueueRouter.get('/queue', requireRole(OfficerRole.OFFICER, OfficerRole.SUPERVISOR), getOfficerQueue);
priorityQueueRouter.post('/:id/assign', requireRole(OfficerRole.OFFICER, OfficerRole.SUPERVISOR), assignComplaint);
priorityQueueRouter.post('/:id/start', requireRole(OfficerRole.OFFICER), startResolution);

