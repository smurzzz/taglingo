/**
 * Phase 1 mock app state — an in-memory stand-in for the Supabase-backed
 * stores that arrive in Phases 3-5. Mirrors the web prototype's app-state:
 * word grading, favorites, quiz results, settings and the offline demo flag.
 *
 * Per docs/02-ARCHITECTURE.md §3.5, `recordQuiz` stores the attempt only and
 * never touches word status — mastery is set exclusively from Flashcard Study.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { todayIndex } from '@/lib/derived';
import {
  initialStats,
  mockUser,
  seedFavorites,
  seedStatus,
} from '@/mocks/progress';
import type { WordStatus } from '@/mocks/words';

export interface QuizResult {
  correct: string[];
  missed: string[];
}

export interface AppState {
  user: typeof mockUser | null;
  status: Record<string, WordStatus>;
  favorites: string[];
  masteredCount: number;
  streak: number;
  dailyGoal: number;
  studiedToday: number;
  weeklyMinutes: number[];
  reminder: { enabled: boolean; time: string };
  darkMode: boolean;
  lastQuiz: QuizResult | null;
  /** demo-only switch so the offline experience can be reviewed while online */
  simulateOffline: boolean;
  offlineDismissed: boolean;
}

export interface AppActions {
  signIn: (email: string) => void;
  signOut: () => void;
  applyAccountPreferences: (prefs: { darkMode: boolean; reminder: { enabled: boolean; time: string } }) => void;
  grade: (wordId: string, result: 'mastered' | 'learning') => void;
  toggleFavorite: (wordId: string) => void;
  recordQuiz: (result: QuizResult) => void;
  setReminder: (reminder: { enabled: boolean; time: string }) => void;
  setDarkMode: (value: boolean) => void;
  setSimulateOffline: (value: boolean) => void;
  dismissOffline: () => void;
  resetOfflineDismissed: () => void;
}

interface AppContextValue {
  state: AppState;
  actions: AppActions;
}

const seed = (): AppState => ({
  user: null,
  status: seedStatus(),
  favorites: seedFavorites(),
  masteredCount: initialStats.masteredCount,
  streak: initialStats.streak,
  dailyGoal: initialStats.dailyGoal,
  studiedToday: initialStats.studiedToday,
  weeklyMinutes: [...initialStats.weeklyMinutes],
  reminder: { ...initialStats.reminder },
  darkMode: false,
  lastQuiz: null,
  simulateOffline: false,
  offlineDismissed: false,
});

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(seed);

  const signIn = useCallback((email: string) => {
    setState((prev) => ({
      ...prev,
      user: { ...mockUser, email: email || mockUser.email },
    }));
  }, []);

  const signOut = useCallback(() => {
    setState((prev) => ({ ...prev, user: null }));
  }, []);

  const applyAccountPreferences = useCallback(
    (prefs: { darkMode: boolean; reminder: { enabled: boolean; time: string } }) => {
      setState((prev) => ({
        ...prev,
        darkMode: prefs.darkMode,
        reminder: prefs.reminder,
      }));
    },
    [],
  );

  const grade = useCallback((wordId: string, result: 'mastered' | 'learning') => {
    setState((prev) => {
      const previous = prev.status[wordId] ?? 'new';
      const status = { ...prev.status, [wordId]: result as WordStatus };
      const delta =
        (result === 'mastered' ? 1 : 0) - (previous === 'mastered' ? 1 : 0);
      const weekly = [...prev.weeklyMinutes];
      weekly[todayIndex()] = Math.max(0, weekly[todayIndex()] + 1);

      return {
        ...prev,
        status,
        masteredCount: Math.max(0, prev.masteredCount + delta),
        studiedToday: prev.studiedToday + 1,
        weeklyMinutes: weekly,
      };
    });
  }, []);

  const toggleFavorite = useCallback((wordId: string) => {
    setState((prev) => ({
      ...prev,
      favorites: prev.favorites.includes(wordId)
        ? prev.favorites.filter((id) => id !== wordId)
        : [...prev.favorites, wordId],
    }));
  }, []);

  const recordQuiz = useCallback((result: QuizResult) => {
    setState((prev) => ({ ...prev, lastQuiz: result }));
  }, []);

  const setReminder = useCallback((reminder: { enabled: boolean; time: string }) => {
    setState((prev) => ({ ...prev, reminder }));
  }, []);

  const setDarkMode = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, darkMode: value }));
  }, []);

  const setSimulateOffline = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, simulateOffline: value, offlineDismissed: false }));
  }, []);

  const dismissOffline = useCallback(() => {
    setState((prev) => ({ ...prev, offlineDismissed: true }));
  }, []);

  const resetOfflineDismissed = useCallback(() => {
    setState((prev) =>
      prev.offlineDismissed ? { ...prev, offlineDismissed: false } : prev,
    );
  }, []);

  const actions = useMemo<AppActions>(
    () => ({
      signIn,
      signOut,
      applyAccountPreferences,
      grade,
      toggleFavorite,
      recordQuiz,
      setReminder,
      setDarkMode,
      setSimulateOffline,
      dismissOffline,
      resetOfflineDismissed,
    }),
    [
      signIn,
      signOut,
      applyAccountPreferences,
      grade,
      toggleFavorite,
      recordQuiz,
      setReminder,
      setDarkMode,
      setSimulateOffline,
      dismissOffline,
      resetOfflineDismissed,
    ],
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used inside <AppStateProvider>');
  }
  return context;
}
