/**
 * Word hooks — Phase 1 lived entirely on the mock fixtures; from Phase 4 the
 * queryFns read the live `words` table through the Clerk-bound Supabase
 * client, and fall back to the fixtures whenever Supabase is unavailable so
 * the no-keys demo path still works.
 *
 * Display-only fields (partOfSpeech, definition, example) don't exist in the
 * DB yet — `mapWord` leaves them empty and Phase 5 (definition lookup) fills
 * them in from the Free Dictionary API.
 */

import { useQuery } from '@tanstack/react-query';

import { useAppAuth } from '@/lib/auth';
import { useSupabaseClient } from '@/lib/supabase';
import { sleep } from '@/lib/utils';
import { levels, wordsInLevel } from '@/mocks/decks';
import {
  findWord,
  words,
  type LevelId,
  type Word,
  type WordStatus,
} from '@/mocks/words';
import type { Database } from '@/types/database';

const LATENCY = 350;

export type WordFilter = 'all' | WordStatus | 'favorites';
type WordRow = Database['public']['Tables']['words']['Row'];

const LEVEL_TO_ID: Record<Database['public']['Enums']['level'], LevelId> = {
  Beginner: 'beginner',
  Intermediate: 'intermediate',
  Advanced: 'advanced',
};

const levelFromDb = (value: Database['public']['Enums']['level']): LevelId =>
  LEVEL_TO_ID[value];

/** DB `words` row -> the Word shape screens render. */
export function mapWord(row: WordRow): Word {
  return {
    id: row.id,
    level: levelFromDb(row.level),
    tagalog: row.tagalog,
    cebuano: row.cebuano,
    english: row.english,
    partOfSpeech: '',
    definition: '',
    example: { language: 'cebuano', text: '', english: '' },
    initialStatus: 'new',
  };
}

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
  const supabase = useSupabaseClient();
  const { userId } = useAppAuth();

  return useQuery({
    queryKey: ['levels'],
    enabled: supabase ? Boolean(userId) : true,
    staleTime: 60_000,
    queryFn: async () => {
      if (!supabase) {
        await sleep(LATENCY);
        return levels;
      }
      const { data, error } = await supabase.from('words').select('level');
      if (error) throw error;
      const counts = new Map<LevelId, number>();
      for (const row of data) {
        const id = levelFromDb(row.level);
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      return levels.map((level) => ({ ...level, vocabulary: counts.get(level.id) ?? 0 }));
    },
  });
}

export function useAllWords() {
  const supabase = useSupabaseClient();
  const { userId } = useAppAuth();

  return useQuery({
    queryKey: ['words'],
    enabled: supabase ? Boolean(userId) : true,
    staleTime: 30_000,
    queryFn: async () => {
      if (!supabase) {
        await sleep(LATENCY);
        return words;
      }
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .order('level', { ascending: true })
        .order('english', { ascending: true });
      if (error) throw error;
      return data.map(mapWord);
    },
  });
}

export function useWordsByLevel(levelId: LevelId) {
  const supabase = useSupabaseClient();
  const { userId } = useAppAuth();

  return useQuery({
    queryKey: ['words', 'level', levelId],
    enabled: supabase ? Boolean(userId) : true,
    staleTime: 30_000,
    queryFn: async () => {
      if (!supabase) {
        await sleep(LATENCY);
        return wordsInLevel(levelId);
      }
      const levelName: Database['public']['Enums']['level'] =
        levelId === 'beginner'
          ? 'Beginner'
          : levelId === 'intermediate'
            ? 'Intermediate'
            : 'Advanced';
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .eq('level', levelName)
        .order('english', { ascending: true });
      if (error) throw error;
      return data.map(mapWord);
    },
  });
}

/**
 * Definition lookup — still the mock stand-in for `GET /api/definitions/:word`
 * (architecture doc §7). Wired to the Free Dictionary API in Phase 5. Words
 * flagged `mockLookupFails` simulate `{ found: false }`; unknown ids (e.g.
 * live DB words without definitions yet) return the same graceful miss.
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
