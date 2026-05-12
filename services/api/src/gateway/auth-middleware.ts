// ═══════════════════════════════════════════════════════════════════
// Auth Middleware — Supabase JWT verification
// Extracts user identity and role from the JWT, attaches to req.
// ═══════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JWTPayload, OfficerRole } from '../types';
import { logger } from '../lib/logger';
import { supabaseAdmin } from '../db/supabase-client';

// Extend Express Request to carry auth context
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      accessToken?: string;
    }
  }
}

/**
 * Verifies the Supabase JWT and attaches user context to the request.
 * For anonymous routes, use `optionalAuth` instead.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header', status: 401 });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the JWT signature using Supabase JWT secret
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    // Look up officer details from the database
    const { data: officer, error } = await supabaseAdmin
      .from('officers')
      .select('id, ward_id, department, role, name')
      .eq('supabase_user_id', decoded.sub)
      .single();

    if (error || !officer) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'User is not a registered officer', status: 403 });
      return;
    }

    // Look up zone_id from the ward
    let zone_id: string | null = null;
    if (officer.ward_id) {
      const { data: ward } = await supabaseAdmin
        .from('wards')
        .select('zone_id')
        .eq('id', officer.ward_id)
        .single();
      zone_id = ward?.zone_id || null;
    }

    req.user = {
      sub: decoded.sub,
      email: decoded.email || '',
      role: officer.role as OfficerRole,
      officer_id: officer.id,
      ward_id: officer.ward_id,
      zone_id,
      department: officer.department,
      iat: decoded.iat,
      exp: decoded.exp,
    };
    req.accessToken = token;

    next();
  } catch (err: any) {
    logger.warn('JWT verification failed', { error: err.message });
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or expired token', status: 401 });
    return;
  }
}

/**
 * Optional auth — attaches user context if present, but doesn't block.
 * Used for public routes where auth enriches but isn't required.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    const { data: officer } = await supabaseAdmin
      .from('officers')
      .select('id, ward_id, department, role, name')
      .eq('supabase_user_id', decoded.sub)
      .single();

    if (officer) {
      let zone_id: string | null = null;
      if (officer.ward_id) {
        const { data: ward } = await supabaseAdmin.from('wards').select('zone_id').eq('id', officer.ward_id).single();
        zone_id = ward?.zone_id || null;
      }
      req.user = {
        sub: decoded.sub,
        email: decoded.email || '',
        role: officer.role as OfficerRole,
        officer_id: officer.id,
        ward_id: officer.ward_id,
        zone_id,
        department: officer.department,
        iat: decoded.iat,
        exp: decoded.exp,
      };
      req.accessToken = token;
    }
  } catch {
    // Silently ignore — user just won't be attached
  }
  next();
}

/**
 * Role guard — restricts route to specific roles.
 * Usage: app.get('/admin', requireRole('ADMIN', 'IT_HEAD'), handler)
 */
export function requireRole(...roles: OfficerRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required', status: 401 });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `Requires one of: ${roles.join(', ')}. You have: ${req.user.role}`,
        status: 403,
      });
      return;
    }
    next();
  };
}

