// ═══════════════════════════════════════════════════════════════════
// Logger — Structured JSON logging via Winston
// ═══════════════════════════════════════════════════════════════════

import winston from 'winston';
import { config } from '../config';

export const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: {
    service: 'ghmc-api',
    phase: config.currentPhase,
    demo_mode: config.demoMode,
  },
  transports: [
    new winston.transports.Console({
      format: config.nodeEnv === 'development'
        ? winston.format.combine(winston.format.colorize(), winston.format.simple())
        : winston.format.json(),
    }),
  ],
});

// Critical event loggers — these MUST be called for observability
export const criticalEvents = {
  complaintIntakeFailed: (error: any, context: Record<string, any>) =>
    logger.error('COMPLAINT_INTAKE_FAILED', { error: error.message, ...context }),

  routingError: (complaintId: string, error: any) =>
    logger.error('ROUTING_ERROR', { complaint_id: complaintId, error: error.message }),

  aiApiFailure: (model: string, error: any) =>
    logger.error('AI_API_FAILURE', { model, error: error.message }),

  rlsPolicyViolation: (userId: string, resource: string) =>
    logger.error('RLS_POLICY_VIOLATION', { user_id: userId, resource }),

  fraudScoreElevated: (officerId: string, score: number, tier: string) =>
    logger.warn('FRAUD_SCORE_ELEVATED', { officer_id: officerId, score, tier }),

  integrationDeferred: (type: string, target: string, message: string) =>
    logger.info('INTEGRATION_DEFERRED', { type, target, message, demo_mode: true }),
};

