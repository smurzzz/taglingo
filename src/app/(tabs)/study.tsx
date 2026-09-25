import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { DefinitionSheet } from '@/components/taglingo/DefinitionSheet';
import { ScreenHeader } from '@/components/taglingo/ScreenHeader';
import { SproutMark } from '@/components/taglingo/LogoMark';
import { OfflineBanner } from '@/components/taglingo/OfflineBanner';
import { WordCard } from '@/components/taglingo/WordCard';
import { Radius, Spacing } from '@/constants/theme';
import { useIsOffline } from '@/hooks/use-offline';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { levelProgress, studyOrder } from '@/lib/derived';
import {
  useGradeWord,
  useProgressSnapshot,
  useRecordStudySession,
  useToggleFavorite,
} from '@/features/progress/api';
import { useWordsByLevel } from '@/features/words/api';
import { levels, getLevel } from '@/mocks/decks';
import type { LevelId } from '@/mocks/words';

/**
 * Flashcard Study Mode (functionality prompt §4): flip-to-reveal, grade as
 * mastered/learning, favorite, and deep-linkable definition lookup. Weak
 * (learning) words surface first per the spec.
 */
export default function StudyScreen() {
  const router = useRouter();
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ level?: string; start?: string }>();
  const level = getLevel(params.level);
  const offline = useIsOffline();

  const snapshot = useProgressSnapshot();
  const gradeWord = useGradeWord();
  const toggleFavorite = useToggleFavorite();
  const recordSession = useRecordStudySession();
  const sessionRecorded = useRef(false);

  const snapshotStatus = snapshot.data?.status;
  const favorites = snapshot.data?.favorites ?? [];

  const words = useWordsByLevel(level.id);
  const deck = useMemo(
    () => studyOrder(words.data ?? [], snapshotStatus ?? {}),
    [words.data, snapshotStatus],
  );

  const [index, setIndex] = useState(0);
  const levelRef = useRef(level.id);
  const lastStart = useRef<string | undefined>(undefined);

  const [flipped, setFlipped] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    // only reset when the level actually changes — the first render must keep
    // the deep-linked word from "Review these" / the word list
    if (levelRef.current === level.id) return;
    levelRef.current = level.id;
    setIndex(0);
    setFlipped(false);
    setFinished(false);
  }, [level.id]);

  // one study_sessions row per calendar day, on first mount of the screen
  useEffect(() => {
    if (sessionRecorded.current) return;
    sessionRecorded.current = true;
    recordSession.mutate();
  }, [recordSession]);

  // apply the deep-linked start word once the deck has loaded (and whenever
  // the target word changes) — mock data arrives asynchronously
  useEffect(() => {
    if (deck.length === 0 || lastStart.current === params.start) return;
    lastStart.current = params.start;
    const found = deck.findIndex((word) => word.id === params.start);
    setIndex(found > 0 ? found : 0);
    setFlipped(false);
    setFinished(false);
  }, [deck, params.start]);

  const word = deck[index];
  const favorite = word ? favorites.includes(word.id) : false;
  const progress = levelProgress(snapshotStatus ?? {}, level.id);

  const advance = (result: 'mastered' | 'learning') => {
    if (!word) return;
    gradeWord.mutate({ wordId: word.id, result });
    setFlipped(false);
    if (index + 1 >= deck.length) {
      setFinished(true);
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title={`${Math.min(index + 1, deck.length)} / ${deck.length}`}
        onClose={() => router.push('/')}
        right={
          <Pressable
            accessibilityLabel="Take the quiz"
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/quiz', params: { level: level.id } })}
            hitSlop={8}
            style={styles.headerIcon}
          >
            <Ionicons name="list" size={20} color={theme.mutedForeground} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, Spacing.eight) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {offline ? <OfflineBanner /> : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.levelChips}
        >
          {levels.map((item) => {
            const active = item.id === level.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() =>
                  router.replace({ pathname: '/study', params: { level: item.id as LevelId } })
                }
                style={[styles.levelChip, active && { backgroundColor: theme.accent }]}
              >
                <AppText
                  variant="caption"
                  style={{
                    color: active ? theme.accentForeground : theme.mutedForeground,
                    fontWeight: '700',
                  }}
                >
                  {item.name}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        {words.isPending ? (
          <SkeletonList rows={1} />
        ) : words.isError ? (
          <ErrorState onRetry={() => words.refetch()} />
        ) : finished ? (
          <View style={styles.finished}>
            <View style={[styles.finishedBadge, { backgroundColor: theme.accent }]}>
              <SproutMark size={44} />
            </View>
            <AppText variant="display" bold style={styles.finishedTitle}>
              That&apos;s the whole deck
            </AppText>
            <AppText variant="label" muted center style={styles.finishedHint}>
              <AppText variant="label" bold>
                {progress.mastered}
              </AppText>{' '}
              of {progress.total} {level.name.toLowerCase()} words are mastered. Keep the streak
              going.
            </AppText>
            <View style={styles.finishedActions}>
              <Button
                variant="sage"
                onPress={() => router.push({ pathname: '/quiz', params: { level: level.id } })}
              >
                Take the quiz
              </Button>
              <Button
                variant="outline"
                onPress={() => {
                  setIndex(0);
                  setFinished(false);
                  setFlipped(false);
                }}
              >
                <View style={styles.outlineButton}>
                  <Ionicons name="refresh" size={16} color={theme.foreground} />
                  <AppText variant="label" style={styles.outlineButtonLabel}>
                    Study again
                  </AppText>
                </View>
              </Button>
            </View>
          </View>
        ) : word ? (
          <>
            <WordCard
              word={word}
              flipped={flipped}
              favorite={favorite}
              onFlip={() => setFlipped((value) => !value)}
              onToggleFavorite={() => toggleFavorite.mutate(word.id)}
              onOpenDefinition={() => setSheetOpen(true)}
            />

            <View style={styles.gradeRow}>
              <Button variant="outline" onPress={() => advance('learning')} style={styles.gradeButton}>
                <View style={styles.outlineButton}>
                  <Ionicons name="refresh" size={16} color={theme.foreground} />
                  <AppText variant="label" style={styles.outlineButtonLabel}>
                    Still learning
                  </AppText>
                </View>
              </Button>
              <Button variant="sage" onPress={() => advance('mastered')} style={styles.gradeButton}>
                <View style={styles.outlineButton}>
                  <Ionicons name="checkmark" size={16} color={theme.primaryForeground} />
                  <AppText
                    variant="label"
                    style={[styles.outlineButtonLabel, { color: theme.primaryForeground }]}
                  >
                    Mastered
                  </AppText>
                </View>
              </Button>
            </View>

            <AppText variant="caption" muted center style={styles.progressCaption}>
              <AppText variant="caption" style={{ color: theme.foreground, fontWeight: '700' }}>
                {progress.mastered}
              </AppText>{' '}
              / {progress.total} mastered in {level.name}
            </AppText>
          </>
        ) : null}
      </ScrollView>

      <DefinitionSheet
        word={word}
        favorite={favorite}
        visible={sheetOpen}
        onToggleFavorite={() => {
          if (!word) return;
          toggleFavorite.mutate(word.id);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  headerIcon: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelChips: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  levelChip: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  finished: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.ten,
  },
  finishedBadge: {
    height: 80,
    width: 80,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishedTitle: {
    fontSize: 24,
  },
  finishedHint: {
    maxWidth: 280,
    textAlign: 'center',
  },
  finishedActions: {
    alignSelf: 'stretch',
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  gradeRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  gradeButton: {
    flex: 1,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  outlineButtonLabel: {
    fontWeight: '600',
    fontSize: 16,
  },
  progressCaption: {
    marginTop: Spacing.one,
  },
});
