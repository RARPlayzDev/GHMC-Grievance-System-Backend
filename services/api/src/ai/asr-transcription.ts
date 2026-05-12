// ═══════════════════════════════════════════════════════════════════
// ASR Transcription — Audio-to-text via Groq Whisper
// Telugu/English/Hindi/Urdu support
// ═══════════════════════════════════════════════════════════════════

import { groqTranscribe } from './groq-client';
import { AITranscriptionResult } from '../types';

export async function transcribeAudio(audioBuffer: Buffer, hintLanguage?: string): Promise<AITranscriptionResult> {
  const result = await groqTranscribe(audioBuffer, hintLanguage);
  return { transcription: result.text, language_detected: result.language };
}

