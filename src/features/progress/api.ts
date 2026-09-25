/**
 * Progress hooks — Phase 1 read the mock app store; from Phase 4 the queryFns
 * read the live `word_progress`, `study_sessions` and `words` tables through
 * the Clerk-bound Supabase client, falling back to the mocks whenever Supabase
 * is unavailable. Screens invalidate these keys after every mutation
 * (grade/favorite) so mastery shows up on Home, Browse and My Words without a
 * manual refresh — see docs/03-CODE-STANDARDS.md §5.
 *
 * Real mode = supabase client configured AND a real Clerk session. Any other
 * state (demo/no-keys) keeps the seeded mock behaviour so the offline path
 * still demonstrates the whole flow.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

import { useAppAuth } from '@/lib/auth';
import { useAppState } from '@/lib/app-state';
import { levelProgress, statusCounts } from '@/lib/derived';
import { sleep } from '@/lib/utils';
import { useSupabaseClient } from '@/lib/supabase';
import { filterWords, mapWord, type WordFilter } from '@/features/words/api';
import { words } from '@/mocks/words';
import type { LevelId, WordStatus } from '@/mocks/words';
import type { Database } from '@/types/database';

const LATENCY = 300;

export type { WordFilter };

export type ProgressSnapshot = {
  status: Record<string, WordStatus>;
  favorites: string[];
  /** word_id -> ISO timestamp of the last grade — mock snapshots omit it. */
  updatedAt?: Record<string, string>;
};

export type ProgressSummary = {
  streak: number;
  masteredCount: number;
  studiedToday: number;
  dailyGoal: number;
  /** Kept for shape-stability with the mock; now words-graded-per-day. */
  weeklyMinutes: number[];
};

type UseableDB = SupabaseClient<Database>;

const localDateKey = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Monday-first index used by the UI week chart; today is always the last bar. */
const weekdayLabelIndex = (date: Date = new Date()) => (date.getDay() + 6) % 7;

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

/** Live snapshot: all word_progress rows -> status/favorite/updated maps. */
async function fetchRealSnapshot(db: UseableDB): Promise<ProgressSnapshot> {
  const { data, error } = await db
    .from('word_progress')
    .select('word_id, status, is_favorite, updated_at');
  if (error) throw error;
  const status: Record<string, WordStatus> = {};
  const updatedAt: Record<string, string> = {};
  const favorites: string[] = [];
  for (const row of data ?? []) {
    if (row.status) status[row.word_id] = row.status;
    if (row.updated_at) updatedAt[row.word_id] = row.updated_at;
    if (row.is_favorite) favorites.push(row.word_id);
  }
  return { status, favorites, updatedAt };
}

/** Consecutive-day streak from study_sessions dates (react-query-free helper). */
export function computeStreak(studiedOn: string[]): number {
  const days = new Set(studiedOn);
  const start = days.has(localDateKey()) ? new Date() : addDays(new Date(), -1);
  let streak = 0;
  let cursor = start;
  while (days.has(localDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Current week, Monday-first, words-graded-per-day (matches the mock shape). */
export function weeklyCounts(updatedAt: Record<string, string>): number[] {
  const today = new Date();
  const monday = addDays(today, -weekdayLabelIndex(today));
  const buckets: { key: string; count: number }[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    buckets.push({ key: localDateKey(addDays(monday, offset)), count: 0 });
  }
  for (const iso of Object.values(updatedAt)) {
    const key = localDateKey(new Date(iso));
    const bucket = buckets.find((value) => value.key === key);
    if (bucket) bucket.count += 1;
  }
  return buckets.map((bucket) => bucket.count);
}

export function useProgressSnapshot() {
  const { state } = useAppState();
  const supabase = useSupabaseClient();
  const { userId } = useAppAuth();

  return useQuery({
    queryKey: ['progress', 'snapshot'],
    enabled: supabase ? Boolean(userId) : true,
    staleTime: 30_000,
    queryFn: async () => {
      if (!supabase) {
        await sleep(LATENCY);
        return { status: state.status, favorites: state.favorites };
      }
      return fetchRealSnapshot(supabase);
    },
  });
}

export function useProgressSummary() {
  const { state } = useAppState();
  const supabase = useSupabaseClient();
  const { userId } = useAppAuth();

  return useQuery({
    queryKey: ['progress', 'summary'],
    enabled: supabase ? Boolean(userId) : true,
    staleTime: 30_000,
    queryFn: async (): Promise<ProgressSummary> => {
      await sleep(LATENCY);
      if (!supabase) {
        return {
          streak: state.streak,
          masteredCount: state.masteredCount,
          studiedToday: state.studiedToday,
          dailyGoal: state.dailyGoal,
          weeklyMinutes: [...state.weeklyMinutes],
        };
      }
      const snap = await fetchRealSnapshot(supabase);
      const { data: sessions, error: sessionError } = await supabase
        .from('study_sessions')
        .select('studied_on');
      if (sessionError) throw sessionError;

      const updatedAt = snap.updatedAt ?? {};
      const studiedToday = Object.values(updatedAt).filter(
        (iso) => localDateKey(new Date(iso)) === localDateKey(),
      ).length;

      return {
        streak: computeStreak((sessions ?? []).map((row) => row.studied_on)),
        masteredCount: Object.values(snap.status).filter((value) => value === 'mastered').length,
        studiedToday,
        dailyGoal: 20,
        weeklyMinutes: weeklyCounts(updatedAt),
      };
    },
  });
}

export function useLevelProgress(levelId: LevelId) {
  const { state } = useAppState();
  const supabase = useSupabaseClient();
  const { userId } = useAppAuth();

  return useQuery({
    queryKey: ['progress', 'level', levelId],
    enabled: supabase ? Boolean(userId) : true,
    staleTime: 30_000,
    queryFn: async () => {
      if (!supabase) {
        await sleep(LATENCY);
        return levelProgress(state.status, levelId);
      }
      const snap = await fetchRealSnapshot(supabase);
      const levelName: Database['public']['Enums']['level'] =
        levelId === 'beginner'
          ? 'Beginner'
          : levelId === 'intermediate'
            ? 'Intermediate'
            : 'Advanced';
      const { data, error } = await supabase
        .from('words')
        .select('id')
        .eq('level', levelName);
      if (error) throw error;
      const ids = (data ?? []).map((row) => row.id);
      const mastered = ids.filter((id) => snap.status[id] === 'mastered').length;
      const learning = ids.filter((id) => snap.status[id] === 'learning').length;
      return {
        mastered,
        learning,
        fresh: ids.length - mastered - learning,
        total: ids.length,
        percent: ids.length ? Math.round((mastered / ids.length) * 100) : 0,
      };
    },
  });
}

export function useStatusCounts() {
  const { state } = useAppState();
  const supabase = useSupabaseClient();
  const { userId } = useAppAuth();

  return useQuery({
    queryKey: ['progress', 'counts'],
    enabled: supabase ? Boolean(userId) : true,
    staleTime: 30_000,
    queryFn: async () => {
      if (!supabase) {
        await sleep(LATENCY);
        return statusCounts(state.status);
      }
      const snap = await fetchRealSnapshot(supabase);
      const { data, error } = await supabase.from('words').select('id');
      if (error) throw error;
      const ids = (data ?? []).map((row) => row.id);
      return {
        mastered: ids.filter((id) => snap.status[id] === 'mastered').length,
        learning: ids.filter((id) => snap.status[id] === 'learning').length,
        fresh: ids.filter((id) => !snap.status[id] || snap.status[id] === 'new').length,
      };
    },
  });
}

/**
 * "My Words" per functionality prompt §8: every word the user has touched —
 * has a progress row (status != new) or is favorited — across all levels.
 */
export function useTouchedWords(filter: WordFilter) {
  const { state } = useAppState();
  const supabase = useSupabaseClient();
  const { userId } = useAppAuth();

  return useQuery({
    queryKey: ['words', 'touched', filter],
    enabled: supabase ? Boolean(userId) : true,
    staleTime: 30_000,
    queryFn: async () => {
      if (!supabase) {
        await sleep(LATENCY);
        const touched = words.filter(
          (word) =>
            (state.status[word.id] ?? 'new') !== 'new' ||
            state.favorites.includes(word.id),
        );
        return filterWords(touched, filter, state.status, state.favorites);
      }
      const snap = await fetchRealSnapshot(supabase);
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .order('level', { ascending: true })
        .order('english', { ascending: true });
      if (error) throw error;
      const all = (data ?? []).map(mapWord);
      const touched = all.filter(
        (word) =>
          (snap.status[word.id] ?? 'new') !== 'new' ||
          snap.favorites.includes(word.id),
      );
      return filterWords(touched, filter, snap.status, snap.favorites);
    },
  });
}

/**
 * Grade a word mastered/learning (Flashcard Study). Writes word_progress in
 * real mode; updates the mock store otherwise. Always invalidates the progress
 * subtree so Home/Browse/"My words" reflect the new mastery immediately.
 */
export function useGradeWord() {
  const queryClient = useQueryClient();
  const supabase = useSupabaseClient();
  const { userId } = useAppAuth();
  const { actions } = useAppState();

  return useMutation({
    mutationFn: async ({ wordId, result }: { wordId: string; result: 'mastered' | 'learning' }) => {
      if (!supabase) {
        actions.grade(wordId, result);
        return;
      }
      if (!userId) return;
      const { error } = await supabase.from('word_progress').upsert(
        {
          user_id: userId,
          word_id: wordId,
          status: result,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,word_id' },
      );
      if (error) throw error;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['progress'] });
      void queryClient.invalidateQueries({ queryKey: ['words'] });
    },
  });
}

/**
 * Favorite toggle. In real mode the row lifecycle follows word_progress:
 *   - no row           -> insert favorite (status stays 'new')
 *   - favorite on      -> unfavorite; delete the row when it was only a favorite
 *   - not currently    -> mark favorite, keeping the existing grade
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const supabase = useSupabaseClient();
  const { userId } = useAppAuth();
  const { actions } = useAppState();

  return useMutation({
    mutationFn: async (wordId: string) => {
      if (!supabase) {
        actions.toggleFavorite(wordId);
        return;
      }
      if (!userId) return;
      const { data, error } = await supabase
        .from('word_progress')
        .select('status, is_favorite')
        .eq('user_id', userId)
        .eq('word_id', wordId)
        .maybeSingle();
      if (error) throw error;

      if (data?.is_favorite) {
        if (data.status && data.status !== 'new') {
          const { error: updateError } = await supabase
            .from('word_progress')
            .update({ is_favorite: false, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('word_id', wordId);
          if (updateError) throw updateError;
        } else {
          const { error: deleteError } = await supabase
            .from('word_progress')
            .delete()
            .eq('user_id', userId)
            .eq('word_id', wordId);
          if (deleteError) throw deleteError;
        }
      } else if (data) {
        const { error: updateError } = await supabase
          .from('word_progress')
          .update({ is_favorite: true, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('word_id', wordId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('word_progress').insert({
          user_id: userId,
          word_id: wordId,
          is_favorite: true,
        });
        if (insertError) throw insertError;
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['progress'] });
      void queryClient.invalidateQueries({ queryKey: ['words'] });
    },
  });
}

/** One study_sessions row per calendar day (mock mode is a no-op). */
export function useRecordStudySession() {
  const queryClient = useQueryClient();
  const supabase = useSupabaseClient();
  const { userId } = useAppAuth();

  return useMutation({
    mutationFn: async () => {
      if (!supabase || !userId) return;
      const { error } = await supabase
        .from('study_sessions')
        .upsert(
          { user_id: userId, studied_on: localDateKey() },
          { onConflict: 'user_id,studied_on', ignoreDuplicates: true },
        );
      if (error) throw error;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}
