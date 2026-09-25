/**
 * Quiz hooks — records completed attempts into `quiz_attempts` (architecture
 * doc §3.5). Deliberately independent of `word_progress`: a quiz result never
 * auto-grades a word. Real mode = Supabase client configured AND a real Clerk
 * session; otherwise the write is a no-op and the results screen reads the
 * in-memory `lastQuiz` from app state.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAppAuth } from '@/lib/auth';
import { useSupabaseClient } from '@/lib/supabase';
import { levelToDb } from '@/features/words/api';
import type { LevelId } from '@/mocks/words';

export function useRecordQuizAttempt() {
  const queryClient = useQueryClient();
  const supabase = useSupabaseClient();
  const { userId } = useAppAuth();

  return useMutation({
    mutationFn: async ({
      level,
      score,
      totalQuestions,
      missedWordIds,
    }: {
      level: LevelId;
      score: number;
      totalQuestions: number;
      missedWordIds: string[];
    }) => {
      if (!supabase || !userId) return;
      const { error } = await supabase.from('quiz_attempts').insert({
        user_id: userId,
        level: levelToDb(level),
        score,
        total_questions: totalQuestions,
        missed_word_ids: missedWordIds,
      });
      if (error) throw error;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}