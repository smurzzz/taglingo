import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '@/components/taglingo/ScreenHeader';
import { OfflineBanner } from '@/components/taglingo/OfflineBanner';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { QuizOption } from '@/components/taglingo/QuizOption';
import { useAppState } from '@/lib/app-state';
import { buildQuizFromDeck, type QuizQuestion } from '@/lib/derived';
import { useWordsByLevel } from '@/features/words/api';
import { useRecordQuizAttempt } from '@/features/quiz/api';
import { useRecordStudySession } from '@/features/progress/api';
import { getLevel } from '@/mocks/decks';
import type { LevelId } from '@/mocks/words';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Radius, Spacing } from '@/constants/theme';

function isLevelId(value: unknown): value is LevelId {
  return value === 'beginner' || value === 'intermediate' || value === 'advanced';
}

export default function QuizScreen() {
  const params = useLocalSearchParams<{ level?: string }>();
  const levelId: LevelId = isLevelId(params.level) ? params.level : 'beginner';
  const level = getLevel(levelId);

  const colors = useThemeColors();
  const { actions } = useAppState();
  const words = useWordsByLevel(levelId);
  const recordAttempt = useRecordQuizAttempt();
  const recordSession = useRecordStudySession();

  const questions = useMemo<QuizQuestion[]>(
    () => buildQuizFromDeck(words.data ?? [], 10),
    [words.data],
  );

  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState<string[]>([]);
  const [missed, setMissed] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [resolved, setResolved] = useState(false);

  // reset progress whenever the level changes (questions stay keyed to the
  // words query, which serves each level separately)
  const levelRef = useRef(levelId);
  useEffect(() => {
    if (levelRef.current === levelId) return;
    levelRef.current = levelId;
    setIndex(0);
    setCorrect([]);
    setMissed([]);
    setSelected(null);
    setResolved(false);
  }, [levelId]);

  if (words.isPending) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader
          title="Quiz"
          onClose={() => router.replace({ pathname: '/study', params: { level: levelId } })}
        />
        <OfflineBanner />
        <View style={styles.body}>
          <SkeletonList rows={3} />
        </View>
      </View>
    );
  }

  if (words.isError || questions.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader
          title="Quiz"
          onClose={() => router.replace({ pathname: '/study', params: { level: levelId } })}
        />
        <OfflineBanner />
        <View style={styles.body}>
          <ErrorState
            message={words.isError ? undefined : 'This deck does not have enough words for a quiz yet.'}
            onRetry={() => words.refetch()}
          />
        </View>
      </View>
    );
  }

  const question = questions[index];
  const answerIndex = question.options.indexOf(question.answer);
  const isLast = index === questions.length - 1;

  const select = (optionIndex: number) => {
    if (resolved) return;
    const isCorrect = optionIndex === answerIndex;
    setCorrect((prev) => (isCorrect ? [...prev, question.word.id] : prev));
    setMissed((prev) => (isCorrect ? prev : [...prev, question.word.id]));
    setSelected(optionIndex);
    setResolved(true);
  };

  const advance = () => {
    if (!isLast) {
      setIndex(index + 1);
      setSelected(null);
      setResolved(false);
      return;
    }
    recordAttempt.mutate({
      level: levelId,
      score: correct.length,
      totalQuestions: questions.length,
      missedWordIds: missed,
    });
    recordSession.mutate();
    actions.recordQuiz({ correct, missed });
    router.replace('/quiz-results');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={`Question ${index + 1} of ${questions.length}`}
        onClose={() => router.replace({ pathname: '/study', params: { level: levelId } })}
      />
      <OfflineBanner />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dots}>
          {questions.map((q, dotIndex) => {
            let dotColor = colors.mutedForeground;
            let opacity = 0.4;
            if (dotIndex < index) {
              dotColor = missed.includes(q.word.id) ? colors.coral : colors.primary;
              opacity = 1;
            } else if (dotIndex === index) {
              dotColor = colors.primary;
              opacity = 1;
            }
            return (
              <View
                key={q.word.id}
                style={[styles.dot, { backgroundColor: dotColor, opacity }]}
              />
            );
          })}
        </View>

        <Card style={styles.questionCard}>
          <AppText variant="overline" muted style={styles.questionLabel}>
            {level.name} quiz
          </AppText>
          <AppText variant="hero" style={styles.word}>
            {question.word.cebuano}
          </AppText>
          <AppText variant="body" muted>
            What is the English meaning?
          </AppText>
        </Card>

        <View style={styles.options}>
          {question.options.map((option, optionIndex) => {
            let state: 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed' = 'idle';
            if (resolved) {
              if (optionIndex === answerIndex) state = 'correct';
              else if (optionIndex === selected) state = 'wrong';
              else state = 'dimmed';
            } else if (optionIndex === selected) {
              state = 'selected';
            }
            return (
              <QuizOption
                key={option}
                label={option}
                letter={String.fromCharCode(65 + optionIndex)}
                state={state}
                onPress={() => select(optionIndex)}
              />
            );
          })}
        </View>

        {resolved ? (
          <View
            style={[
              styles.feedback,
              {
                backgroundColor:
                  selected === answerIndex ? colors.sageSoft : colors.coralSoft,
              },
            ]}
          >
            <Ionicons
              name={selected === answerIndex ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={selected === answerIndex ? colors.sage : colors.coral}
            />
            <AppText
              variant="body"
              bold
              color={selected === answerIndex ? 'sage' : 'coral'}
            >
              {selected === answerIndex
                ? 'Correct'
                : `Correct answer: ${question.answer}`}
            </AppText>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Button
            variant="sage"
            size="block"
            disabled={!resolved}
            onPress={advance}
          >
            {isLast ? 'See results' : 'Next question'}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.five,
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.eight,
    gap: Spacing.five,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  questionCard: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  questionLabel: {
    textTransform: 'uppercase',
  },
  word: {
    textAlign: 'center',
  },
  options: {
    gap: Spacing.three,
  },
  feedback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
  },
  footer: {
    marginTop: Spacing.one,
  },
});