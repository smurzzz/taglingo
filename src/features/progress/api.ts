/**
 * Phase 1 progress hooks — React Query reads over the mock app store with
 * simulated latency. Components invalidate these keys after every mutation
 * (grade/favorite) so screens stay in sync, matching the Phase 4 Supabase
 * invalidation pattern from docs/03-CODE-STANDARDS.md §5.
 */

import { useQuery } from '@tanstack/react-query';

import { useAppState } from '@/lib/app-state';
import { levelProgress, statusCounts } from '@/lib/derived';
import { sleep } from '@/lib/utils';
import { filterWords, type WordFilter } from '@/features/words/api';
import { words } from '@/mocks/words';
import type { LevelId } from '@/mocks/words';

const LATENCY = 300;

export type { WordFilter };

export function useProgressSummary() {
  const { state } = useAppState();
  return useQuery({
    queryKey: ['progress', 'summary'],
    staleTime: 30_000,
    queryFn: async () => {
      await sleep(LATENCY);
      return {
        streak: state.streak,
        masteredCount: state.masteredCount,
        studiedToday: state.studiedToday,
        dailyGoal: state.dailyGoal,
        weeklyMinutes: state.weeklyMinutes,
      };
    },
  });
}

export function useLevelProgress(levelId: LevelId) {
  const { state } = useAppState();
  return useQuery({
    queryKey: ['progress', 'level', levelId],
    staleTime: 30_000,
    queryFn: async () => {
      await sleep(LATENCY);
      return levelProgress(state.status, levelId);
    },
  });
}

export function useStatusCounts() {
  const { state } = useAppState();
  return useQuery({
    queryKey: ['progress', 'counts'],
    staleTime: 30_000,
    queryFn: async () => {
      await sleep(LATENCY);
      return statusCounts(state.status);
    },
  });
}

/**
 * "My Words" per functionality prompt §8: every word the user has touched —
 * has a progress row (status != new) or is favorited — across all levels.
 */
export function useTouchedWords(filter: WordFilter) {
  const { state } = useAppState();
  return useQuery({
    queryKey: ['words', 'touched', filter],
    staleTime: 30_000,
    queryFn: async () => {
      await sleep(LATENCY);
      const touched = words.filter(
        (word) =>
          (state.status[word.id] ?? 'new') !== 'new' ||
          state.favorites.includes(word.id),
      );
      return filterWords(touched, filter, state.status, state.favorites);
    },
  });
}
