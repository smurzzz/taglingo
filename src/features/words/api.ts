/**
 * Word hooks — Phase 1 lived entirely on the mock fixtures; from Phase 4 the
 * queryFns read the live `words` table through the Clerk-bound Supabase
 * client, and fall back to the fixtures whenever Supabase is unavailable so
 * the no-keys demo path still works.
 *
 * Display fields: `part_of_speech` + `definition` are curated in the words
 * table (migration 20260929000000) and mapped straight through; `useDefinition`
 * shows them first and only reaches for the Free Dictionary API (Phase 5) when
 * a word has no curated definition.
 */

import { useQuery } from '@tanstack/react-query';

import { useAppAuth } from '@/lib/auth';
import { useSupabaseClient } from '@/lib/supabase';
import { sleep } from '@/lib/utils';
import { levels, wordsInLevel } from '@/mocks/decks';
import {
  words,
  type LevelId,
  type Word,
  type WordStatus,
} from '@/mocks/words';
import type { Database } from '@/types/database';

const LATENCY = 350;

/** Free Dictionary API — the only live third-party call (02-ARCHITECTURE §7). */
const DEFINITIONS_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';

export type WordFilter = 'all' | WordStatus | 'favorites';
type WordRow = Database['public']['Tables']['words']['Row'];
type DbLevel = Database['public']['Enums']['level'];

const LEVEL_TO_ID: Record<DbLevel, LevelId> = {
  Beginner: 'beginner',
  Intermediate: 'intermediate',
  Advanced: 'advanced',
};

const LEVEL_NAMES: Record<LevelId, DbLevel> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const levelFromDb = (value: DbLevel): LevelId => LEVEL_TO_ID[value];

/** LevelId -> the enum value used by the `words.level` / `quiz_attempts.level` columns. */
export const levelToDb = (levelId: LevelId): DbLevel => LEVEL_NAMES[levelId];

/** DB `words` row -> the Word shape screens render. */
export function mapWord(row: WordRow): Word {
  return {
    id: row.id,
    level: levelFromDb(row.level),
    tagalog: row.tagalog,
    cebuano: row.cebuano,
    english: row.english,
    partOfSpeech: row.part_of_speech ?? '',
    definition: row.definition ?? '',
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
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .eq('level', levelToDb(levelId))
        .order('english', { ascending: true });
      if (error) throw error;
      return data.map(mapWord);
    },
  });
}

/**
 * First entry of the Free Dictionary API response normalized onto a Word copy
 * with its display-only fields filled in. `null` when no entry has a meaning.
 */
function mapDictionaryEntry(word: Word, entry: DictionaryEntry): Word | null {
  const meaning = entry.meanings?.[0];
  const first = meaning?.definitions?.[0];
  if (!meaning || !first) return null;
  return {
    ...word,
    partOfSpeech: meaning.partOfSpeech ?? '',
    definition: first.definition ?? '',
    example: {
      language: 'english',
      text: first.example ?? '',
      english: '',
    },
  };
}

interface DictionaryEntry {
  word?: string;
  meanings?: {
    partOfSpeech?: string;
    definitions?: { definition?: string; example?: string }[];
  }[];
}

/**
 * Definition lookup. Curated first: when the word row already carries a
 * `part_of_speech`/`definition` (migration 20260929000000) it resolves
 * immediately, with no network call. Only otherwise does it call the Free
 * Dictionary API for the English face (02-ARCHITECTURE §7); a 404, an entry
 * with no usable meaning, or any network failure resolves to `{ found: false }`
 * so the UI renders the graceful "no definition" state — never a generic error.
 */
export function useDefinition(word: Word | undefined) {
  return useQuery({
    queryKey: ['definition', word?.id],
    enabled: Boolean(word?.english),
    staleTime: 60_000,
    queryFn: async (): Promise<DefinitionResult> => {
      if (!word) return { found: false };

      // Curated entry ships with the word — instant, offline-friendly.
      if (word.definition.trim()) {
        return {
          found: true,
          word: {
            ...word,
            partOfSpeech: word.partOfSpeech || 'word',
            example: {
              language: 'english',
              text: word.example.text,
              english: word.example.english,
            },
          },
        };
      }

      const english = word.english.trim();
      if (!english) return { found: false };
      try {
        const response = await fetch(
          `${DEFINITIONS_BASE}/${encodeURIComponent(english)}`,
          { headers: { accept: 'application/json' } },
        );
        if (!response.ok) return { found: false };
        const entries = (await response.json()) as DictionaryEntry[];
        const enriched = entries.map((entry) => mapDictionaryEntry(word, entry)).find(Boolean);
        return enriched ? { found: true, word: enriched } : { found: false };
      } catch {
        return { found: false };
      }
    },
  });
}
