/**
 * TagLingo Phase 1 mock decks — level metadata plus the small lookup helpers
 * screens use to navigate the mock word library.
 *
 * `vocabulary` is the size of the full level library shown on the level
 * cards; the mock `deck` (words in mocks/words.ts) is the curated subset
 * that drives study, quiz and the word lists.
 */

import { words, type LevelId, type Word } from '@/mocks/words';

export interface Level {
  id: LevelId;
  name: string;
  blurb: string;
  vocabulary: number;
}

export const levels: Level[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    blurb: 'Greetings, politeness and everyday basics.',
    vocabulary: 420,
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    blurb: 'Feelings, daily verbs and useful nouns.',
    vocabulary: 680,
  },
  {
    id: 'advanced',
    name: 'Advanced',
    blurb: 'Abstract ideas and formal expressions.',
    vocabulary: 920,
  },
];

export const getLevel = (id: string | null | undefined): Level =>
  levels.find((level) => level.id === id) ?? levels[0];

export const wordsInLevel = (levelId: LevelId): Word[] =>
  words.filter((word) => word.level === levelId);
