import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

import { useAppAuth } from '@/lib/auth';
import { backendConfig, env } from '@/lib/env';
import type { Database } from '@/types/database';

/**
 * Clerk-authenticated Supabase client (Phase 3).
 *
 * Supabase is configured as the Clerk third-party-auth provider, so every
 * request must carry the current Clerk session token. supabase-js exposes a
 * per-request `accessToken` callback for exactly this; we forward the Clerk
 * `getToken()` result through it and disable GoTrue session management so the
 * client never tries to own the auth session.
 *
 * Returns null when Supabase (or Clerk) is not configured, which also disables
 * every Supabase-backed query in the app.
 */
export function useSupabaseClient(): SupabaseClient<Database> | null {
  const { getToken } = useAppAuth();

  return useMemo(() => {
    if (!backendConfig.supabase || !backendConfig.clerk) return null;
    return createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      accessToken: async () => (await getToken()) ?? null,
    });
  }, [getToken]);
}