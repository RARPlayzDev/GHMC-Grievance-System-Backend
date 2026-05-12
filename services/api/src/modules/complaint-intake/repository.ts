// ═══════════════════════════════════════════════════════════════════
// Complaint Intake — Repository (Supabase queries only, no logic)
// ═══════════════════════════════════════════════════════════════════

import { supabaseAdmin } from '../../db/supabase-client';
import { Complaint, ComplaintStatus, Bundle } from '../../types';

export async function insertComplaint(data: Partial<Complaint>): Promise<Complaint> {
  const { data: complaint, error } = await supabaseAdmin
    .from('complaints')
    .insert(data)
    .select()
    .single();
  if (error) throw new Error(`Insert complaint failed: ${error.message}`);
  return complaint;
}

export async function getComplaintById(id: string): Promise<Complaint | null> {
  const { data, error } = await supabaseAdmin.from('complaints').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function updateComplaint(id: string, data: Partial<Complaint>): Promise<Complaint> {
  const { data: complaint, error } = await supabaseAdmin
    .from('complaints')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Update complaint failed: ${error.message}`);
  return complaint;
}

export async function findBundleCandidates(geohash: string, category: string, hoursWindow: number = 24): Promise<Complaint[]> {
  const cutoff = new Date(Date.now() - hoursWindow * 3600000).toISOString();
  const geohash7 = geohash.substring(0, 7);
  const { data } = await supabaseAdmin
    .from('complaints')
    .select('*')
    .like('geohash', `${geohash7}%`)
    .eq('category', category)
    .gte('created_at', cutoff)
    .is('bundle_id', null);
  return data || [];
}

export async function insertBundle(data: Partial<Bundle>): Promise<Bundle> {
  const { data: bundle, error } = await supabaseAdmin.from('bundles').insert(data).select().single();
  if (error) throw new Error(`Insert bundle failed: ${error.message}`);
  return bundle;
}

export async function getComplaintsByStatus(status: ComplaintStatus, wardId?: string): Promise<Complaint[]> {
  let query = supabaseAdmin.from('complaints').select('*').eq('status', status);
  if (wardId) query = query.eq('ward_id', wardId);
  const { data } = await query.order('created_at', { ascending: false });
  return data || [];
}

export async function insertActionLog(data: { complaint_id: string; officer_id?: string; action_type: string; metadata?: any }) {
  // Get previous hash for chain
  const { data: last } = await supabaseAdmin
    .from('action_logs')
    .select('hash_chain_current')
    .eq('complaint_id', data.complaint_id)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  await supabaseAdmin.from('action_logs').insert({
    ...data,
    hash_chain_previous: last?.hash_chain_current || null,
  });
}

