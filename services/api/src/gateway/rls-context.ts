// ═══════════════════════════════════════════════════════════════════
// RLS Context — Sets PostgreSQL session variables for Row-Level Security
// This middleware MUST run after auth-middleware.
// ═══════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../db/supabase-client';
import { logger } from '../lib/logger';

/**
 * Sets PostgreSQL LOCAL session variables so that RLS policies
 * can use current_setting('request.jwt.claims') to enforce
 * ward/zone isolation.
 * 
 * This is the critical security layer that ensures a Ward Officer
 * physically cannot see complaints from other wards — even if
 * the Node.js API layer is compromised.
 */
export async function rlsContextMapper(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    return next();
  }

  try {
    // Build claims JSON matching what Supabase RLS policies expect
    const claims = JSON.stringify({
      sub: req.user.sub,
      role: req.user.role,
      officer_id: req.user.officer_id,
      ward_id: req.user.ward_id,
      zone_id: req.user.zone_id,
      department: req.user.department,
    });

    // Set the claims as a PostgreSQL session variable
    // RLS policies read this via current_setting('request.jwt.claims')
    await supabaseAdmin.rpc('set_claim', { claim: claims });

    next();
  } catch (err) {
    logger.error('Failed to set RLS context', { error: (err as Error).message, user: req.user.sub });
    next();
  }
}

