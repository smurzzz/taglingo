/**
 * TagLingo Phase 1 mock progress — seeded user, stats and preferences so the
 * prototype opens with realistic numbers. Shapes mirror docs/02-ARCHITECTURE.md:
 * - status/favorites  -> word_progress rows (§3.3)
 * - streak/weekly     -> study_sessions aggregates (§3.4)
 * - reminder          -> users.reminder_enabled / reminder_time (§3.1)
 */

import { words } from '@/mocks/words';

export interface MockUser {
  name: string;
  email: string;
  initials: string;
  joined: string;
}

export const mockUser: MockUser = {
  name: 'Alex Rivera',
  email: 'alex@example.com',
  initials: 'AR',
  joined: 'March 2026',
};

export const seedStatus = (): Record<string, 'mastered' | 'learning' | 'new'> =>
  Object.fromEntries(words.map((word) => [word.id, word.initialStatus]));

export const seedFavorites = (): string[] =>
  words.filter((word) => word.initialFavorite).map((word) => word.id);

export const initialStats = {
  /** global stat across the full library, larger than the local mock deck */
  masteredCount: 248,
  streak: 12,
  dailyGoal: 20,
  studiedToday: 16,
  weeklyMinutes: [12, 18, 24, 20, 16, 10, 8],
  reminder: { enabled: true, time: '19:30' },
};
