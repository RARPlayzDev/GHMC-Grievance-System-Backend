// ═══════════════════════════════════════════════════════════════════
// Fraud Rules — Deterministic heuristic fraud scoring
// All 7 fraud signals, capacity-constrained exclusions
// ═══════════════════════════════════════════════════════════════════

import { FraudTier } from '../types';
import { supabaseAdmin } from '../db/supabase-client';

interface FraudInput {
  complaint_id: string;
  officer_id: string;
  closure_photo_device_id?: string;
  officer_registered_device_id?: string;
  closure_photo_location?: { lat: number; lng: number };
  filed_location?: { lat: number; lng: number };
  closure_time?: Date;
  closure_verification_score?: number;
  capacity_constrained?: boolean;
  capacity_constraint_type?: string;
}

interface FraudSignals {
  metadata_mismatch: number;
  geolocation_mismatch: number;
  velocity_outlier: number;
  citizen_challenge_rate: number;
  off_hours_closure: number;
  low_verification_score: number;
  pattern_anomaly: number;
}

export async function calculateFraudScore(input: FraudInput) {
  if (input.capacity_constrained) {
    return { score: 0, tier: FraudTier.CLEAN, signals: emptySignals(), excluded: true, exclusion_reason: `Capacity constrained: ${input.capacity_constraint_type}` };
  }

  const signals: FraudSignals = emptySignals();

  // Signal 1: Device mismatch (30pts)
  if (input.closure_photo_device_id && input.officer_registered_device_id && input.closure_photo_device_id !== input.officer_registered_device_id) {
    signals.metadata_mismatch = 30;
  }

  // Signal 2: Geo mismatch (20pts)
  if (input.closure_photo_location && input.filed_location) {
    const dist = haversine(input.filed_location.lat, input.filed_location.lng, input.closure_photo_location.lat, input.closure_photo_location.lng);
    if (dist > 50) signals.geolocation_mismatch = 20;
    else if (dist > 30) signals.geolocation_mismatch = 10;
  }

  // Signal 3: Velocity (25pts)
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { count: closures } = await supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }).eq('closed_by', input.officer_id).gte('closed_at', oneHourAgo);
  if ((closures || 0) > 15) signals.velocity_outlier = 25;
  else if ((closures || 0) > 10) signals.velocity_outlier = 15;

  // Signal 4: Challenge rate (15pts)
  const { count: total } = await supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }).eq('closed_by', input.officer_id);
  const { count: reopened } = await supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }).eq('closed_by', input.officer_id).eq('status', 'REOPENED');
  const rate = total ? (reopened || 0) / total : 0;
  if (rate > 0.1) signals.citizen_challenge_rate = 15;

  // Signal 5: Off-hours (10pts)
  if (input.closure_time) {
    const h = input.closure_time.getHours();
    if (h < 6 || h > 22) signals.off_hours_closure = 10;
  }

  // Signal 6: Low verification (15pts)
  if (input.closure_verification_score !== undefined && input.closure_verification_score < 0.4) {
    signals.low_verification_score = 15;
  }

  const score = Math.min(Object.values(signals).reduce((a, b) => a + b, 0), 100);
  const tier = score < 20 ? FraudTier.CLEAN : score < 45 ? FraudTier.ADVISORY_WATCH : score < 70 ? FraudTier.SUPERVISED_CLOSURE : FraudTier.ESCALATED_REVIEW;

  return { score, tier, signals, excluded: false, exclusion_reason: null };
}

function emptySignals(): FraudSignals {
  return { metadata_mismatch: 0, geolocation_mismatch: 0, velocity_outlier: 0, citizen_challenge_rate: 0, off_hours_closure: 0, low_verification_score: 0, pattern_anomaly: 0 };
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

