/**
 * Phase 1 word hooks — React Query over the mock fixtures with simulated
 * latency, so loading skeletons are a real code path. Phase 4 swaps these
 * queryFns for Supabase calls behind the same hook names and query keys.
 */

import { useQuery } from '@tanstack/react-query';

import { sleep } from '@/lib/utils';
import { levels, wordsInLevel } from '@/mocks/decks';
import {
  findWord,
  words,
  type LevelId,
  type Word,
  type WordStatus,
} from '@/mocks/words';

const LATENCY = 350;

export type WordFilter = 'all' | WordStatus | 'favorites';

/** Client-side status/favorite filtering shared by the word list screens. */
export const filterWords = (
  deck: Word[],
  filter: WordFilter,
  status: Record<string, WordStatus>,
  favorites: string[],
): Word[] =>
  deck.filter((word) => {
    if (filter === 'all') return true;
    if (filter === 'favorites') return favorites.includes(word.id);
    return (status[word.id] ?? 'new') === filter;
  });

export type DefinitionResult = { found: true; word: Word } | { found: false };

export function useLevels() {
  return useQuery({
    queryKey: ['levels'],
    staleTime: 60_000,
    queryFn: async () => {
      await sleep(LATENCY);
      return levels;
    },
  });
}

export function useAllWords() {
  return useQuery({
    queryKey: ['words'],
    staleTime: 30_000,
    queryFn: async () => {
      await sleep(LATENCY);
      return words;
    },
  });
}

export function useWordsByLevel(levelId: LevelId) {
  return useQuery({
    queryKey: ['words', 'level', levelId],
    staleTime: 30_000,
    queryFn: async () => {
      await sleep(LATENCY);
      return wordsInLevel(levelId);
    },
  });
}

/**
 * Mock definition lookup, standing in for `GET /api/definitions/:word`
 * (architecture doc §7). Words flagged `mockLookupFails` simulate the API
 * responding `{ found: false }` so that state is demoable.
 */
export function useDefinition(wordId: string | undefined) {
  return useQuery({
    queryKey: ['definition', wordId],
    enabled: Boolean(wordId),
    staleTime: 60_000,
    queryFn: async (): Promise<DefinitionResult> => {
      await sleep(700);
      const word = findWord(wordId);
      if (!word) return { found: false };
      if (word.mockLookupFails) return { found: false };
      return { found: true, word };
    },
  });
}
