// ═══════════════════════════════════════════════════════════════════
// Config — Centralized environment variable loading + phase gating
// ═══════════════════════════════════════════════════════════════════

import dotenv from 'dotenv';
import { PhaseConfig } from './types';

dotenv.config();

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optionalEnv(key: string, fallback: string = ''): string {
  return process.env[key] || fallback;
}

export const config = {
  port: parseInt(optionalEnv('PORT', '3000'), 10),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  demoMode: optionalEnv('DEMO_MODE', 'true') === 'true',
  currentPhase: parseInt(optionalEnv('GHMC_CURRENT_PHASE', '3'), 10),

  supabase: {
    url: requireEnv('SUPABASE_URL'),
    anonKey: requireEnv('SUPABASE_ANON_KEY'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    storageBucket: optionalEnv('SUPABASE_STORAGE_BUCKET', 'complaint-photos'),
  },

  groq: {
    apiKey: requireEnv('GROQ_API_KEY'),
    modelText: optionalEnv('GROQ_MODEL_TEXT', 'llama3-8b-8192'),
    modelVision: optionalEnv('GROQ_MODEL_VISION', 'llama-3.2-90b-vision-preview'),
    modelWhisper: optionalEnv('GROQ_MODEL_WHISPER', 'whisper-large-v3'),
    rateLimitDaily: parseInt(optionalEnv('GROQ_RATE_LIMIT_DAILY', '14400'), 10),
    rateLimitMinute: parseInt(optionalEnv('GROQ_RATE_LIMIT_MINUTE', '10'), 10),
  },

  redis: {
    url: requireEnv('UPSTASH_REDIS_URL'),
    token: requireEnv('UPSTASH_REDIS_TOKEN'),
  },

  jwt: {
    secret: requireEnv('JWT_SECRET'),
  },

  cors: {
    origins: optionalEnv('ALLOWED_ORIGINS', 'http://localhost:5173').split(','),
  },

  storage: {
    provider: optionalEnv('STORAGE_PROVIDER', 'supabase') as 'supabase' | 's3',
  },

  integrations: {
    smsProvider: optionalEnv('SMS_PROVIDER', 'none'),
    whatsappProvider: optionalEnv('WHATSAPP_PROVIDER', 'none'),
    bsnlSmsApiKey: optionalEnv('BSNL_SMS_API_KEY'),
    imdApiKey: optionalEnv('IMD_API_KEY'),
    hmdaApiKey: optionalEnv('HMDA_API_KEY'),
  },

  logging: {
    level: optionalEnv('LOG_LEVEL', 'info'),
  },
} as const;

// ──────────────────────────── Phase Feature Gates ────────────────────────────

export function getPhaseConfig(): PhaseConfig {
  const phase = config.currentPhase;
  return {
    current_phase: phase,
    features: {
      ai_categorization: phase >= 2,
      photo_diff: phase >= 3,
      fraud_scoring: phase >= 3,
      surge_forecast: phase >= 2,
      priority_queue: phase >= 2,
      chronic_sites: phase >= 3,
      accountability_dashboard: phase >= 4,
      rti_packaging: phase >= 4,
      community_verifiers: phase >= 4,
      ward_digest: phase >= 5,
      model_governance: phase >= 5,
    },
  };
}

export function isFeatureEnabled(feature: keyof PhaseConfig['features']): boolean {
  return getPhaseConfig().features[feature];
}

