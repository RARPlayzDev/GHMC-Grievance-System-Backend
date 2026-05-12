// ═══════════════════════════════════════════════════════════════════
// Groq Client — Wrapper for all AI inference calls
// Handles rate limiting, retries, and structured JSON output
// ═══════════════════════════════════════════════════════════════════

import Groq from 'groq-sdk';
import { config } from '../config';
import { logger, criticalEvents } from '../lib/logger';
import { checkAIQuota } from '../gateway/rate-limiter';

const groq = new Groq({ apiKey: config.groq.apiKey });

interface GroqTextRequest {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

interface GroqVisionRequest {
  systemPrompt: string;
  textPrompt: string;
  imageBase64: string;
  model?: string;
  maxTokens?: number;
}

/**
 * Send a text completion request to Groq and parse the JSON response.
 * All AI prompts MUST return valid JSON — no conversational text.
 */
export async function groqTextCompletion<T>(req: GroqTextRequest): Promise<T> {
  const quota = await checkAIQuota();
  if (!quota.allowed) {
    throw new AIQuotaExhaustedError(quota.reason || 'DAILY_LIMIT');
  }

  try {
    const completion = await groq.chat.completions.create({
      model: req.model || config.groq.modelText,
      messages: [
        { role: 'system', content: req.systemPrompt },
        { role: 'user', content: req.userPrompt },
      ],
      max_tokens: req.maxTokens || 1024,
      temperature: req.temperature ?? 0.1,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq');

    return JSON.parse(content) as T;
  } catch (err: any) {
    criticalEvents.aiApiFailure(req.model || config.groq.modelText, err);
    throw err;
  }
}

/**
 * Send a vision (image + text) request to Groq.
 * Used for auto-categorization and photo-diff verification.
 */
export async function groqVisionCompletion<T>(req: GroqVisionRequest): Promise<T> {
  const quota = await checkAIQuota();
  if (!quota.allowed) {
    throw new AIQuotaExhaustedError(quota.reason || 'DAILY_LIMIT');
  }

  try {
    const completion = await groq.chat.completions.create({
      model: req.model || config.groq.modelVision,
      messages: [
        { role: 'system', content: req.systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: req.textPrompt },
            {
              type: 'image_url',
              image_url: { url: `data:image/webp;base64,${req.imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: req.maxTokens || 1024,
      temperature: 0.1,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq Vision');

    // Extract JSON from potentially wrapped response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in Groq Vision response');

    return JSON.parse(jsonMatch[0]) as T;
  } catch (err: any) {
    criticalEvents.aiApiFailure(req.model || config.groq.modelVision, err);
    throw err;
  }
}

/**
 * Transcribe audio using Groq's Whisper model.
 */
export async function groqTranscribe(audioBuffer: Buffer, language?: string): Promise<{ text: string; language: string }> {
  const quota = await checkAIQuota();
  if (!quota.allowed) {
    throw new AIQuotaExhaustedError(quota.reason || 'DAILY_LIMIT');
  }

  try {
    const file = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });
    const transcription = await groq.audio.transcriptions.create({
      file,
      model: config.groq.modelWhisper,
      language: language || undefined,
      response_format: 'json',
    });

    return {
      text: transcription.text,
      language: language || 'auto',
    };
  } catch (err: any) {
    criticalEvents.aiApiFailure('whisper', err);
    throw err;
  }
}

// Custom error for quota exhaustion — triggers fallback to manual
export class AIQuotaExhaustedError extends Error {
  constructor(public reason: string) {
    super(`AI quota exhausted: ${reason}`);
    this.name = 'AIQuotaExhaustedError';
  }
}

