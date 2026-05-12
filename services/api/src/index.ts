// ═══════════════════════════════════════════════════════════════════
// GHMC Grievance Platform — Express API Monolith Entry Point
// All module routes registered here. Single deployment target.
// ═══════════════════════════════════════════════════════════════════

import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { config, getPhaseConfig } from './config';
import { logger } from './lib/logger';
import { rateLimiter } from './gateway/rate-limiter';
import { authMiddleware, optionalAuth } from './gateway/auth-middleware';
import { rlsContextMapper } from './gateway/rls-context';
import { errorHandler } from './gateway/error-handler';

// Module routers
import { intakeRouter } from './modules/complaint-intake/routes';
import { routingRouter } from './modules/ward-routing/routes';
import { categorisationRouter } from './modules/categorisation/routes';
import { priorityQueueRouter } from './modules/priority-queue/routes';
import { closureRouter } from './modules/closure-verification/routes';
import { fraudRouter } from './modules/fraud-scoring/routes';
import { chronicSiteRouter } from './modules/chronic-site/routes';
import { dashboardRouter } from './modules/dashboard/routes';
import { rtiRouter } from './modules/rti-packaging/routes';
import { contractorRouter } from './modules/contractor-registry/routes';
import { digestRouter } from './modules/digest/routes';
import { disputeRouter } from './modules/dispute-arbitration/routes';
import { modelGovernanceRouter } from './modules/model-governance/routes';
import { gisRouter } from './modules/gis-governance/routes';
import { notificationRouter } from './modules/notification/routes';

// Queue worker registration
import { queue, QUEUE_NAMES } from './queue/memory-queue';
import { processNotificationJob } from './modules/notification/routes';

const app = express();

// ──────────────────────────── Global Middleware ────────────────────────────

app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({ origin: config.cors.origins, credentials: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(rateLimiter);

// ──────────────────────────── Health Check ────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'ghmc-api',
    version: '1.0.0',
    phase: config.currentPhase,
    demo_mode: config.demoMode,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ──────────────────────────── Phase Config Endpoint ────────────────────────────

app.get('/api/v1/config/phase', (_req, res) => {
  res.json(getPhaseConfig());
});

// ══════════════════════════════════════════════════════════════════
//  PUBLIC ROUTES (no auth required)
// ══════════════════════════════════════════════════════════════════

// Complaint filing — anonymous allowed
app.use('/api/v1/complaints', optionalAuth, intakeRouter);

// Ward listing — public
app.use('/api/v1/routing', optionalAuth, routingRouter);

// ══════════════════════════════════════════════════════════════════
//  PROTECTED ROUTES (auth required)
// ══════════════════════════════════════════════════════════════════

app.use(authMiddleware);
app.use(rlsContextMapper);

// Officer routes
app.use('/api/v1/officers', priorityQueueRouter);
app.use('/api/v1/complaints', closureRouter);
app.use('/api/v1/complaints', categorisationRouter);

// Contractor routes
app.use('/api/v1/contractors', contractorRouter);

// Dashboard routes
app.use('/api/v1/dashboard', dashboardRouter);

// Fraud scoring routes
app.use('/api/v1/fraud', fraudRouter);

// Chronic site routes
app.use('/api/v1/chronic-sites', chronicSiteRouter);

// RTI packaging routes
app.use('/api/v1/rti', rtiRouter);

// Digest routes
app.use('/api/v1/digest', digestRouter);

// Dispute routes
app.use('/api/v1/disputes', disputeRouter);

// Notification routes
app.use('/api/v1/notifications', notificationRouter);

// ══════════════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ══════════════════════════════════════════════════════════════════

app.use('/api/admin/model-governance', modelGovernanceRouter);
app.use('/api/admin/gis', gisRouter);

// ──────────────────────────── Error Handler ────────────────────────────

app.use(errorHandler);

// ──────────────────────────── Queue Workers ────────────────────────────

queue.registerWorker(QUEUE_NAMES.NOTIFICATION, processNotificationJob);
queue.registerWorker(QUEUE_NAMES.FRAUD_SCORING, async (data) => {
  // Import dynamically to avoid circular deps
  const { calculateFraudScore } = await import('./ai/fraud-rules');
  const { supabaseAdmin } = await import('./db/supabase-client');

  const result = await calculateFraudScore(data);
  await supabaseAdmin.from('fraud_scores').insert({
    complaint_id: data.complaint_id,
    officer_id: data.officer_id,
    score: result.score,
    tier: result.tier,
    signals: result.signals,
    excluded: result.excluded,
    exclusion_reason: result.exclusion_reason,
  });
});

// ──────────────────────────── Start Server ────────────────────────────

app.listen(config.port, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════╗
║  GHMC Grievance Platform API                             ║
║  Port:  ${config.port}                                          ║
║  Phase: ${config.currentPhase}                                            ║
║  Demo:  ${config.demoMode}                                         ║
║  Env:   ${config.nodeEnv}                                  ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export default app;

