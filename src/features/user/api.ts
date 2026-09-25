/**
 * Phase 3 account hooks — the users row behind Profile and Settings.
 *
 * `ensure_user` (security-definer RPC) creates the row synchronously on first
 * login; useCurrentUser reads it back; useUpdateAccountPreferences persists the
 * reminder/dark-mode switches back. All of it goes through the Clerk-bound
 * Supabase client, gated by RLS on `auth.jwt()->>'sub'`.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAppAuth } from '@/lib/auth';
import { useSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type UserRow = Database['public']['Tables']['users']['Row'];

export interface AccountPreferences {
  dark_mode?: boolean;
  reminder_enabled?: boolean;
  reminder_time?: string;
}

const userKey = (userId: string | null) => ['user', userId ?? 'none'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatJoined(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'today';
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function useCurrentUser() {
  const supabase = useSupabaseClient();
  const { userId } = useAppAuth();

  return useQuery({
    queryKey: userKey(userId),
    enabled: supabase !== null && Boolean(userId),
    queryFn: async () => {
      if (!supabase || !userId) throw new Error('Supabase or account unavailable');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useEnsureUser() {
  const supabase = useSupabaseClient();
  const { userId, user } = useAppAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!supabase || !userId) throw new Error('Supabase or account unavailable');
      const { data, error } = await supabase.rpc('ensure_user', {
        p_full_name: user.name || null,
        p_email: user.email || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (row) => {
      if (row) queryClient.setQueryData(userKey(row.id), row);
    },
  });
}

export function useUpdateAccountPreferences() {
  const supabase = useSupabaseClient();
  const { userId } = useAppAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: AccountPreferences) => {
      if (!supabase || !userId) throw new Error('Supabase or account unavailable');
      const { error } = await supabase.from('users').update(updates).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKey(userId) });
    },
  });
}

/** Display identity: Clerk (or mock) profile merged with the persisted users row. */
export function useAuthUser() {
  const auth = useAppAuth();
  const { data: row, isPending, isError } = useCurrentUser();

  const joined = row?.created_at ? formatJoined(row.created_at) : (auth.user.joined ?? 'today');

  return {
    ...auth.user,
    joined,
    isPending,
    isError,
  };
}