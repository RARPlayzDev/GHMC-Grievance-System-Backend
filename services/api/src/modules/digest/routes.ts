// ═══════════════════════════════════════════════════════════════════
// Ward Digest — 6-signal morning brief for officers
// Synthesises: clusters, queue, SLA breaches, forecast, chronic, resources
// ═══════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../db/supabase-client';
import { requireRole } from '../../gateway/auth-middleware';
import { OfficerRole } from '../../types';
import { forecastSurge } from '../../ai/surge-forecast';
import { groqTextCompletion } from '../../ai/groq-client';

async function getWardDigest(req: Request, res: Response) {
  const wardId = req.user!.ward_id;
  if (!wardId) { res.status(400).json({ error: 'NO_WARD', message: 'No ward assigned', status: 400 }); return; }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  // Signal 1: Top complaint clusters
  const { data: recentComplaints } = await supabaseAdmin.from('complaints')
    .select('category, geohash').eq('ward_id', wardId).gte('created_at', `${today}T00:00:00`);

  const clusters: Record<string, { category: string; count: number; geohash: string }> = {};
  (recentComplaints || []).forEach((c) => {
    const key = `${c.geohash?.substring(0, 5)}_${c.category}`;
    if (!clusters[key]) clusters[key] = { category: c.category, count: 0, geohash: c.geohash?.substring(0, 5) || '' };
    clusters[key].count++;
  });
  const topClusters = Object.values(clusters).sort((a, b) => b.count - a.count).slice(0, 5);

  // Signal 2: Today's priority queue
  const { data: queueItems } = await supabaseAdmin.from('complaints')
    .select('id, category, status, priority_score, created_at')
    .eq('ward_id', wardId)
    .in('status', ['ASSIGNED', 'IN_PROGRESS', 'ROUTED'])
    .order('priority_score', { ascending: false }).limit(10);

  // Signal 3: Yesterday's SLA breaches
  const { count: slaBreaches } = await supabaseAdmin.from('action_logs')
    .select('*', { count: 'exact', head: true })
    .eq('action_type', 'SLA_BREACH')
    .gte('timestamp', `${yesterday}T00:00:00`)
    .lte('timestamp', `${yesterday}T23:59:59`);

  // Signal 4: Tomorrow's surge forecast
  let forecast = null;
  try {
    forecast = await forecastSurge(wardId, tomorrow);
  } catch { /* Forecast unavailable */ }

  // Signal 5: Chronic site updates
  const { data: chronicSites } = await supabaseAdmin.from('chronic_sites')
    .select('*').limit(5);

  // Signal 6: Resource status
  const { data: resources } = await supabaseAdmin.from('resource_status')
    .select('*').eq('ward_id', wardId);

  // Generate recommended action
  let recommendedAction = 'Review your priority queue and address top complaints.';
  try {
    const aiRec = await groqTextCompletion<{ action: string }>({
      systemPrompt: 'Generate a brief (1 sentence) recommended priority action for a ward officer based on their ward data. Return JSON: {"action": "string"}',
      userPrompt: `Queue: ${queueItems?.length || 0} items. SLA breaches yesterday: ${slaBreaches || 0}. Top category: ${topClusters[0]?.category || 'none'}. Surge forecast: ${forecast?.predicted_volume || 'N/A'}.`,
    });
    recommendedAction = aiRec.action;
  } catch { /* Use default */ }

  res.json({
    ward_id: wardId,
    date: today,
    top_clusters: topClusters,
    todays_priority_queue: queueItems || [],
    yesterdays_sla_breaches: slaBreaches || 0,
    tomorrows_surge_forecast: forecast,
    chronic_site_updates: chronicSites || [],
    resource_status: resources || [],
    recommended_action: recommendedAction,
  });
}

export const digestRouter = Router();
digestRouter.get('/', requireRole(OfficerRole.OFFICER, OfficerRole.SUPERVISOR), getWardDigest);

