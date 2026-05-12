// ═══════════════════════════════════════════════════════════════════
// Supabase Client — Database + Auth + Storage
// Two clients: admin (service role) and user-scoped (anon + RLS)
// ═══════════════════════════════════════════════════════════════════

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';

// Admin client — bypasses RLS. Use ONLY in service-layer operations
// that need cross-ward access (e.g., routing, AI processing).
export const supabaseAdmin: SupabaseClient = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

// Anon client — respects RLS. Used for citizen-facing operations.
export const supabaseAnon: SupabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey,
);

/**
 * Creates a Supabase client scoped to a specific user's JWT.
 * This enables RLS policies to enforce ward/zone isolation.
 * 
 * Usage in route handlers:
 *   const db = getUserClient(req.headers.authorization);
 *   const { data } = await db.from('complaints').select('*');
 *   // ↑ Only returns complaints the user's RLS policy allows
 */
export function getUserClient(accessToken: string): SupabaseClient {
  return createClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    }
  );
}

