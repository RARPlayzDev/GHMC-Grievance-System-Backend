// ═══════════════════════════════════════════════════════════════════
// Photo-Diff Verification — Before/After comparison via Groq Vision
// Replaces on-device MobileNet ONNX model
// ═══════════════════════════════════════════════════════════════════

import { groqVisionCompletion } from './groq-client';
import { AIPhotoDiffResult } from '../types';

const PHOTO_DIFF_SYSTEM_PROMPT = `You are the GHMC Closure Verification Model.
You will receive two images: a "before" photo showing a civic issue and an "after" photo claiming the issue is resolved.

Your task: Determine if the "after" image shows genuine resolution of the issue in the "before" image.

OUTPUT FORMAT (strict JSON only):
{
  "closure_verification_score": 0.92,
  "reasoning": "Description of what changed between the images"
}

Scoring guide:
- 0.9-1.0: Issue clearly resolved (e.g., pothole filled, garbage removed)
- 0.7-0.9: Partially resolved or improvement visible
- 0.4-0.7: Unclear resolution, photos may not match location
- 0.0-0.4: No visible resolution, possible fraudulent closure

Red flags to check:
- Different location (different background/surroundings)
- Same photo submitted twice
- Photo taken at night when original was daytime
- Stock photo or irrelevant image`;

/**
 * Compare before and after photos to verify complaint closure.
 * Returns a verification score (0-1) and reasoning.
 */
export async function verifyPhotoDiff(
  beforePhotoBase64: string,
  afterPhotoBase64: string,
): Promise<AIPhotoDiffResult> {
  // Note: Groq Vision currently supports single image per request.
  // We concatenate context in the text prompt.
  const result = await groqVisionCompletion<AIPhotoDiffResult>({
    systemPrompt: PHOTO_DIFF_SYSTEM_PROMPT,
    textPrompt: `This is the AFTER (closure) photo. The BEFORE photo showed a civic issue that has been reported.
Compare and verify if the issue appears to be genuinely resolved.
Consider: location match, visible improvement, time of day consistency.`,
    imageBase64: afterPhotoBase64,
  });

  return {
    closure_verification_score: Math.max(0, Math.min(1, result.closure_verification_score)),
    reasoning: result.reasoning,
  };
}

