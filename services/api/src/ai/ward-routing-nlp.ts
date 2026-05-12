// ═══════════════════════════════════════════════════════════════════
// Ward Routing NLP — AI-powered text-to-ward mapping
// Uses Groq Llama 3 as a substitute for IndicBERT
// ═══════════════════════════════════════════════════════════════════

import { groqTextCompletion } from './groq-client';
import { AIRoutingResult } from '../types';
import { supabaseAdmin } from '../db/supabase-client';

const ROUTING_SYSTEM_PROMPT = `You are the GHMC Ward Routing Model.
Your task is to analyze a civic complaint description and determine which ward it belongs to.
You will be given a list of ward names and their areas. Match the complaint location to the correct ward.

OUTPUT FORMAT (strict JSON only, no other text):
{
  "ward_id": "uuid-of-matched-ward",
  "routing_confidence_score": 0.95,
  "reasoning": "Brief explanation"
}

Rules:
- routing_confidence_score must be between 0.0 and 1.0
- If you cannot determine the ward, set routing_confidence_score below 0.5
- Match based on area names, landmarks, and locality descriptions in the text`;

/**
 * Use NLP to route a complaint to a ward based on description text.
 * This is Signal 2 of the three-signal routing system.
 * Signal 1 (polygon) is handled by PostGIS.
 * Signal 3 (citizen pin) is handled by the frontend geolocation.
 */
export async function routeByNLP(
  description: string,
  wardList: Array<{ id: string; name: string }>
): Promise<AIRoutingResult> {
  const wardsContext = wardList.map((w) => `- ${w.name} (ID: ${w.id})`).join('\n');

  const result = await groqTextCompletion<AIRoutingResult>({
    systemPrompt: ROUTING_SYSTEM_PROMPT,
    userPrompt: `Available wards:\n${wardsContext}\n\nComplaint description:\n"${description}"`,
  });

  return result;
}

/**
 * Three-signal ward routing: combines polygon, NLP, and citizen pin.
 * Returns the ward ID with highest confidence.
 */
export async function resolveWard(
  location: { lat: number; lng: number } | null,
  description: string | null,
): Promise<{ ward_id: string | null; confidence: number; method: string }> {
  const results: Array<{ ward_id: string | null; confidence: number; method: string }> = [];

  // Signal 1: PostGIS polygon lookup
  if (location) {
    const { data: ward } = await supabaseAdmin.rpc('find_ward_by_point', {
      lat: location.lat,
      lng: location.lng,
    });
    if (ward) {
      results.push({ ward_id: ward, confidence: 0.99, method: 'POLYGON' });
    }
  }

  // Signal 2: NLP routing (if description provided)
  if (description && description.length > 10) {
    try {
      const { data: wards } = await supabaseAdmin.from('wards').select('id, name');
      if (wards && wards.length > 0) {
        const nlpResult = await routeByNLP(description, wards);
        results.push({
          ward_id: nlpResult.ward_id,
          confidence: nlpResult.routing_confidence_score,
          method: 'NLP',
        });
      }
    } catch {
      // NLP failed — continue with other signals
    }
  }

  // Signal 3: Citizen pin (same as polygon but from explicit pin-drop)
  // Already handled by Signal 1 since both use lat/lng

  // Pick highest confidence result
  if (results.length === 0) {
    return { ward_id: null, confidence: 0, method: 'NONE' };
  }

  // If multiple signals agree, boost confidence
  const best = results.sort((a, b) => b.confidence - a.confidence)[0];
  const agreeing = results.filter((r) => r.ward_id === best.ward_id).length;

  return {
    ward_id: best.ward_id,
    confidence: Math.min(best.confidence + (agreeing > 1 ? 0.05 : 0), 1.0),
    method: agreeing > 1 ? 'MULTI_SIGNAL' : best.method,
  };
}

