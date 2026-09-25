import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '@/components/taglingo/ScreenHeader';
import { OfflineBanner } from '@/components/taglingo/OfflineBanner';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { QuizOption } from '@/components/taglingo/QuizOption';
import { useAppState } from '@/lib/app-state';
import { buildQuiz } from '@/lib/derived';
import { getLevel } from '@/mocks/decks';
import type { LevelId } from '@/mocks/words';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Radius, Spacing } from '@/constants/theme';

function isLevelId(value: unknown): value is LevelId {
  return value === 'beginner' || value === 'intermediate' || value === 'advanced';
}

interface QuizSession {
  questions: ReturnType<typeof buildQuiz>;
  index: number;
  correct: string[];
  missed: string[];
  selected: number | null;
  resolved: boolean;
}

const initialSession = (levelId: LevelId): QuizSession => ({
  questions: buildQuiz(levelId),
  index: 0,
  correct: [],
  missed: [],
  selected: null,
  resolved: false,
});

export default function QuizScreen() {
  const params = useLocalSearchParams<{ level?: string }>();
  const levelId: LevelId = isLevelId(params.level) ? params.level : 'beginner';
  const level = getLevel(levelId);

  const colors = useThemeColors();
  const { actions } = useAppState();
  const [session, setSession] = useState<QuizSession>(() => initialSession(levelId));

  if (session.questions.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader
          title="Quiz"
          onClose={() => router.replace({ pathname: '/study', params: { level: levelId } })}
        />
        <OfflineBanner />
        <View style={styles.body}>
          <ErrorState
            message="This deck does not have enough words for a quiz yet."
            onRetry={() => setSession(initialSession(levelId))}
          />
        </View>
      </View>
    );
  }

  const question = session.questions[session.index];
  const answerIndex = question.options.indexOf(question.answer);
  const isLast = session.index === session.questions.length - 1;

  const select = (optionIndex: number) => {
    if (session.resolved) return;
    const correct = optionIndex === answerIndex;
    setSession({
      ...session,
      selected: optionIndex,
      resolved: true,
      correct: correct ? [...session.correct, question.word.id] : session.correct,
      missed: correct ? session.missed : [...session.missed, question.word.id],
    });
  };

  const advance = () => {
    if (isLast) {
      actions.recordQuiz({ correct: session.correct, missed: session.missed });
      router.replace('/quiz-results');
      return;
    }
    setSession({ ...session, index: session.index + 1, selected: null, resolved: false });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={`Question ${session.index + 1} of ${session.questions.length}`}
        onClose={() => router.replace({ pathname: '/study', params: { level: levelId } })}
      />
      <OfflineBanner />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dots}>
          {session.questions.map((q, dotIndex) => {
            let dotColor = colors.mutedForeground;
            let opacity = 0.4;
            if (dotIndex < session.index) {
              dotColor = session.missed.includes(q.word.id) ? colors.coral : colors.primary;
              opacity = 1;
            } else if (dotIndex === session.index) {
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
            if (session.resolved) {
              if (optionIndex === answerIndex) state = 'correct';
              else if (optionIndex === session.selected) state = 'wrong';
              else state = 'dimmed';
            } else if (optionIndex === session.selected) {
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

        {session.resolved ? (
          <View
            style={[
              styles.feedback,
              {
                backgroundColor:
                  session.selected === answerIndex ? colors.sageSoft : colors.coralSoft,
              },
            ]}
          >
            <Ionicons
              name={session.selected === answerIndex ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={session.selected === answerIndex ? colors.sage : colors.coral}
            />
            <AppText
              variant="body"
              bold
              color={session.selected === answerIndex ? 'sage' : 'coral'}
            >
              {session.selected === answerIndex
                ? 'Correct'
                : `Correct answer: ${question.answer}`}
            </AppText>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Button
            variant="sage"
            size="block"
            disabled={!session.resolved}
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
