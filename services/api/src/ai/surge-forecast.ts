// ═══════════════════════════════════════════════════════════════════
// Surge Forecast — Calendar-based heuristic (replaces scikit-learn)
// Uses seeded monsoon calendar + historical complaint density
// ═══════════════════════════════════════════════════════════════════

import { supabaseAdmin } from '../db/supabase-client';
import { AISurgeForcastResult } from '../types';

// Hyderabad monsoon months: June–October (peak July–September)
const MONSOON_MULTIPLIERS: Record<number, number> = {
  1: 1.0, 2: 1.0, 3: 1.0, 4: 1.1, 5: 1.2,
  6: 1.5, 7: 2.0, 8: 2.0, 9: 1.8, 10: 1.4,
  11: 1.1, 12: 1.0,
};

export async function forecastSurge(wardId: string, targetDate: string): Promise<AISurgeForcastResult> {
  const date = new Date(targetDate);
  const month = date.getMonth() + 1;
  const dayOfWeek = date.getDay();

  // Get historical average for this ward
  const { data: history } = await supabaseAdmin
    .from('complaints')
    .select('id', { count: 'exact', head: true })
    .eq('ward_id', wardId);

  const { count: last30 } = await supabaseAdmin
    .from('complaints')
    .select('*', { count: 'exact', head: true })
    .eq('ward_id', wardId)
    .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString());

  const dailyAvg = (last30 || 10) / 30;

  // Check seeded monsoon calendar for rainfall data
  const { data: monsoonData } = await supabaseAdmin
    .from('monsoon_calendar')
    .select('rainfall_mm')
    .eq('month', month)
    .eq('day', date.getDate())
    .single();

  const rainfallMultiplier = monsoonData?.rainfall_mm
    ? 1 + (monsoonData.rainfall_mm / 50) * 0.5
    : 1.0;

  // Weekend adjustment
  const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.0;

  const factors: string[] = [];
  const monsoonMult = MONSOON_MULTIPLIERS[month] || 1.0;

  if (monsoonMult > 1.3) factors.push(`Monsoon season (${monsoonMult}x)`);
  if (rainfallMultiplier > 1.1) factors.push(`Expected rainfall: ${monsoonData?.rainfall_mm}mm`);
  if (weekendMultiplier < 1) factors.push('Weekend reduction');

  const predicted = Math.round(dailyAvg * monsoonMult * rainfallMultiplier * weekendMultiplier);

  return {
    ward_id: wardId,
    forecast_date: targetDate,
    predicted_volume: predicted,
    confidence: 0.7,
    factors,
  };
}

