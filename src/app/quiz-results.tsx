import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '@/components/taglingo/ScreenHeader';
import { OfflineBanner } from '@/components/taglingo/OfflineBanner';
import { SproutMark } from '@/components/taglingo/LogoMark';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useAppState } from '@/lib/app-state';
import { useAllWords } from '@/features/words/api';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Radius, Spacing } from '@/constants/theme';

const RING = 62;

export default function QuizResultsScreen() {
  const colors = useThemeColors();
  const { state } = useAppState();
  const allWords = useAllWords();
  const quiz = state.lastQuiz;

  useEffect(() => {
    if (!quiz) {
      router.replace('/');
    }
  }, [quiz]);

  if (!quiz) {
    return null;
  }

  const missedWords = quiz.missed
    .map((id) => allWords.data?.find((w) => w.id === id))
    .filter((w): w is NonNullable<typeof w> => Boolean(w));
  const correct = quiz.correct.length;
  const total = quiz.correct.length + quiz.missed.length;
  const perfect = quiz.missed.length === 0;
  const firstName = state.user?.name.split(' ')[0] ?? 'there';
  const headline = perfect
    ? 'Perfect score'
    : correct / Math.max(1, total) >= 0.7
      ? `Nice work, ${firstName}!`
      : `Good effort, ${firstName}!`;
  const subtitle = perfect
    ? 'Every word in that deck went your way.'
    : 'Missed words are great places to keep studying.';
  const circumference = 2 * Math.PI * RING;
  const scoreAngle = total > 0 ? correct / total : 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Quiz results" onClose={() => router.replace('/')} />
      <OfflineBanner />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.ringWrap}>
            <Svg width={180} height={180} viewBox="0 0 180 180">
              <Circle
                cx={90}
                cy={90}
                r={RING}
                stroke={colors.border}
                strokeWidth={14}
                fill="none"
              />
              <Circle
                cx={90}
                cy={90}
                r={RING}
                stroke={colors.primary}
                strokeWidth={14}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${scoreAngle * circumference} ${circumference}`}
                transform="rotate(-90 90 90)"
              />
            </Svg>
            <View style={styles.ringCenter}>
              <AppText variant="display" bold>
                {correct}/{total}
              </AppText>
              <AppText variant="caption" muted>
                correct
              </AppText>
            </View>
          </View>

          <View
            style={[
              styles.headlineRow,
              { backgroundColor: perfect ? colors.sageSoft : colors.honeySoft },
            ]}
          >
            <SproutMark
              size={44}
              variant={perfect ? 'healthy' : 'wilted'}
              color={colors.primary}
            />
            <View style={styles.headlineText}>
              <AppText
                variant="title"
                bold
                color={perfect ? 'sage' : 'honey'}
              >
                {headline}
              </AppText>
              <AppText variant="body" muted>
                {subtitle}
              </AppText>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AppText variant="label" bold style={styles.sectionTitle}>
            Missed words
          </AppText>
          {missedWords.length === 0 ? (
            <View
              style={[
                styles.nothingMissed,
                { backgroundColor: colors.sageSoft },
              ]}
            >
              <Ionicons name="checkmark-circle" size={18} color={colors.sage} />
              <AppText variant="body" bold color="sage">
                Nothing missed
              </AppText>
            </View>
          ) : (
            <View style={styles.missedList}>
              {missedWords.map((word) => (
                <Pressable
                  key={word.id}
                  style={[styles.missedRow, { borderColor: colors.border }]}
                  onPress={() =>
                    router.push({
                      pathname: '/study',
                      params: { level: word.level, start: word.id },
                    })
                  }
                >
                  <View style={styles.missedText}>
                    <AppText variant="body" bold>
                      {word.cebuano}
                    </AppText>
                    <AppText variant="caption" muted>
                      {word.tagalog} · {word.english}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.actions}>
          {perfect ? (
            <Button
              variant="sage"
              size="block"
              onPress={() => router.push('/browse')}
            >
              Study another deck
            </Button>
          ) : (
            <Button
              variant="sage"
              size="block"
              disabled={missedWords.length === 0}
              onPress={() => {
                const first = missedWords[0];
                if (first) {
                  router.push({
                    pathname: '/study',
                    params: { level: first.level, start: first.id },
                  });
                }
              }}
            >
              Review these
            </Button>
          )}
          <Button
            variant="outline"
            size="block"
            onPress={() => router.replace('/')}
          >
            Back to home
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
  scroll: {
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.eight,
    gap: Spacing.five,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.five,
  },
  ringWrap: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    alignSelf: 'stretch',
  },
  headlineText: {
    flex: 1,
    gap: Spacing.one,
  },
  section: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  sectionTitle: {
    marginBottom: Spacing.three,
  },
  nothingMissed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  missedList: {
    gap: Spacing.two,
  },
  missedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  missedText: {
    flex: 1,
    gap: 2,
  },
  actions: {
    gap: Spacing.three,
  },
});
