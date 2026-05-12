// ═══════════════════════════════════════════════════════════════════
// Auto-Categorisation — Vision + Text classification via Groq
// Replaces IndicBERT + Vision TorchServe with Llama 3 Vision
// ═══════════════════════════════════════════════════════════════════

import { z } from 'zod';
import { groqVisionCompletion, groqTextCompletion } from './groq-client';
import { AICategorizationResult, ComplaintCategory } from '../types';

const CATEGORIZATION_SYSTEM_PROMPT = `You are the GHMC Categorisation Model.
Analyze the civic complaint (image and/or text) to identify the issue type.

GHMC Category Matrix:
- ROADS: Potholes, road damage, missing manholes, speed bumps, road markings
- SANITATION: Garbage dumps, overflowing bins, drain blockage, sewage overflow, dead animals
- WATER: Water supply disruption, pipe leaks, contamination, tanker requests, borewell issues
- ELECTRICITY: Street light failure, exposed wires, transformer issues, power cuts
- OTHER: Stray animals, encroachment, noise complaints, tree hazards, illegal construction

OUTPUT FORMAT (strict JSON only):
{
  "category": "ROADS" | "SANITATION" | "WATER" | "ELECTRICITY" | "OTHER",
  "subcategory": "specific issue type",
  "department_ownership": ["department name(s)"],
  "ai_confidence": 0.88,
  "reasoning": "max 100 chars"
}

Rules:
- ai_confidence must be between 0.0 and 1.0
- If confidence < 0.7, the system will fallback to manual categorization
- department_ownership can have multiple entries for cross-department issues
- Department names: "Engineering", "SWM", "Water Board", "Electricity", "Veterinary", "Enforcement"`;

export const CATEGORIZATION_RESPONSE_SCHEMA = z.object({
  category: z.nativeEnum(ComplaintCategory),
  subcategory: z.string(),
  department_ownership: z.array(z.string()),
  ai_confidence: z.number().min(0).max(1),
  reasoning: z.string().max(200),
});

/**
 * Categorize a complaint using vision (photo) + text.
 * If photo is provided, uses Groq Vision model.
 * If only text, uses text model.
 */
export async function categorizeComplaint(
  description: string | null,
  photoBase64: string | null,
): Promise<AICategorizationResult> {
  if (photoBase64) {
    // Vision + Text categorization
    const result = await groqVisionCompletion<AICategorizationResult>({
      systemPrompt: CATEGORIZATION_SYSTEM_PROMPT,
      textPrompt: description
        ? `Complaint description: "${description}"\n\nAnalyze both the image and text to categorize this civic issue.`
        : 'Analyze this image to categorize the civic issue.',
      imageBase64: photoBase64,
    });

    // Validate response schema
    const validated = CATEGORIZATION_RESPONSE_SCHEMA.parse(result);
    return validated;
  }

  if (description) {
    // Text-only categorization
    const result = await groqTextCompletion<AICategorizationResult>({
      systemPrompt: CATEGORIZATION_SYSTEM_PROMPT,
      userPrompt: `Categorize this civic complaint: "${description}"`,
    });

    const validated = CATEGORIZATION_RESPONSE_SCHEMA.parse(result);
    return validated;
  }

  // No input — return unknown
  return {
    category: ComplaintCategory.OTHER,
    subcategory: 'Uncategorized',
    department_ownership: ['General'],
    ai_confidence: 0,
    reasoning: 'No description or photo provided',
  };
}

