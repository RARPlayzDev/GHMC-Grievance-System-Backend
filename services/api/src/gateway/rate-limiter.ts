// ═══════════════════════════════════════════════════════════════════
// Rate Limiter — Upstash Redis-backed rate limiting
// Device fingerprint velocity checks + API quotas
// ═══════════════════════════════════════════════════════════════════

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../lib/logger';

const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

// General API rate limiter: 100 requests per minute per IP
const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ghmc:ratelimit:api',
});

// Complaint filing rate limiter: 10 complaints per hour per device fingerprint
const complaintLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: 'ghmc:ratelimit:complaint',
});

// AI inference rate limiter: respect Groq's free tier limits
const aiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(config.groq.rateLimitMinute, '1 m'),
  analytics: true,
  prefix: 'ghmc:ratelimit:ai',
});

/**
 * General API rate limiting middleware.
 * Identifies callers by IP address.
 */
export async function rateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const identifier = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const { success, remaining, reset } = await apiLimiter.limit(identifier);

    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset);

    if (!success) {
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        status: 429,
        retry_after: Math.ceil((reset - Date.now()) / 1000),
      });
      return;
    }
    next();
  } catch (err) {
    // If Redis is down, allow the request (fail-open for demo)
    logger.warn('Rate limiter Redis error — failing open', { error: (err as Error).message });
    next();
  }
}

/**
 * Complaint-specific rate limiter.
 * Uses device fingerprint hash for velocity checks.
 */
export async function complaintRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const fingerprint = req.body?.device_fingerprint || req.ip || 'unknown';
    const { success, remaining } = await complaintLimiter.limit(fingerprint);

    if (!success) {
      res.status(429).json({
        error: 'COMPLAINT_RATE_LIMIT',
        message: 'Too many complaints filed from this device. Please try again later.',
        status: 429,
      });
      return;
    }
    next();
  } catch {
    next(); // Fail open
  }
}

/**
 * Check AI quota before making a Groq API call.
 * Returns { allowed, remaining, reason } without blocking the Express chain.
 */
export async function checkAIQuota(): Promise<{ allowed: boolean; remaining: number; reason?: string }> {
  try {
    const dailyKey = `ghmc:ai:daily:${new Date().toISOString().slice(0, 10)}`;
    const count = await redis.incr(dailyKey);

    // Set expiry on first use
    if (count === 1) {
      await redis.expire(dailyKey, 86400);
    }

    if (count > config.groq.rateLimitDaily) {
      return { allowed: false, remaining: 0, reason: 'DAILY_REQUEST_LIMIT' };
    }

    return { allowed: true, remaining: config.groq.rateLimitDaily - count };
  } catch {
    // If Redis is down, allow (fail-open)
    return { allowed: true, remaining: -1 };
  }
}

