/**
 * Pure derived helpers shared by Phase 1 screens — ported from the web
 * prototype, adjusted to match docs/02-ARCHITECTURE.md where the prototype
 * diverged (quiz distractors come from the same level, quiz results never
 * mutate word_progress).
 */

import { levels, wordsInLevel } from '@/mocks/decks';
import { words, type LevelId, type Word, type WordStatus } from '@/mocks/words';

export interface LevelProgress {
  mastered: number;
  learning: number;
  fresh: number;
  total: number;
  percent: number;
}

export const levelProgress = (
  status: Record<string, WordStatus>,
  levelId: LevelId,
): LevelProgress => {
  const deck = wordsInLevel(levelId);
  const mastered = deck.filter((word) => status[word.id] === 'mastered').length;
  const learning = deck.filter((word) => status[word.id] === 'learning').length;
  const total = deck.length || 1;
  return {
    mastered,
    learning,
    fresh: deck.length - mastered - learning,
    total: deck.length,
    percent: Math.round((mastered / total) * 100),
  };
};

export const totalProgress = (status: Record<string, WordStatus>) =>
  levels.map((level) => ({
    level,
    progress: levelProgress(status, level.id),
  }));

export const statusCounts = (status: Record<string, WordStatus>) => {
  const ids = words.map((word) => status[word.id] ?? 'new');
  return {
    mastered: ids.filter((value) => value === 'mastered').length,
    learning: ids.filter((value) => value === 'learning').length,
    fresh: ids.filter((value) => value === 'new').length,
  };
};

/**
 * Study order per docs/07-FUNCTIONALITY-PROMPT.md §4: words still `learning`
 * surface before `new` and `mastered` ones, so weak words get reviewed first.
 */
export const studyOrder = (deck: Word[], status: Record<string, WordStatus>): Word[] => {
  const rank: Record<WordStatus, number> = { learning: 0, new: 1, mastered: 2 };
  return [...deck].sort(
    (a, b) => (rank[status[a.id] ?? 'new'] ?? 1) - (rank[status[b.id] ?? 'new'] ?? 1),
  );
};

export const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export interface QuizQuestion {
  word: Word;
  options: string[];
  answer: string;
}

/**
 * Builds a fixed set of questions so option order never changes on re-render.
 * Distractors are pulled from the same level only (architecture doc §6).
 */
export const buildQuiz = (levelId: LevelId, count = 10): QuizQuestion[] => {
  const deck = shuffle(wordsInLevel(levelId)).slice(0, count);
  const pool = [...new Set(wordsInLevel(levelId).map((word) => word.english))];

  return deck.map((word) => {
    const distractors = shuffle(
      pool.filter((english) => english !== word.english),
    ).slice(0, 3);

    return {
      word,
      answer: word.english,
      options: shuffle([word.english, ...distractors]),
    };
  });
};

export const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Monday-first index for "today". */
export const todayIndex = () => (new Date().getDay() + 6) % 7;

export const levelTone = (percent: number) =>
  percent >= 60 ? 'sage' : percent >= 25 ? 'honey' : 'ink';
