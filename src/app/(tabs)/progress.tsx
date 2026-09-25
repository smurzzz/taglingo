import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ScreenHeader } from '@/components/taglingo/ScreenHeader';
import { StatTile } from '@/components/taglingo/StatTile';
import { WeekChart } from '@/components/taglingo/WeekChart';
import { WordRow } from '@/components/taglingo/WordRow';
import { Radius, Spacing } from '@/constants/theme';
import { useAppState } from '@/lib/app-state';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { levelProgress } from '@/lib/derived';
import { levels } from '@/mocks/decks';
import type { LevelId } from '@/mocks/words';
import {
  useLevelProgress,
  useProgressSummary,
  useStatusCounts,
  useTouchedWords,
  type WordFilter,
} from '@/features/progress/api';

const filters: { id: WordFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'mastered', label: 'Mastered' },
  { id: 'learning', label: 'Learning' },
  { id: 'favorites', label: 'Favorites' },
];

/**
 * Progress (functionality prompt §8 + demo guide §6): weekly history, daily
 * goal, level completion and word status counts, followed by the filterable
 * "My words" list — every word the user has touched, across all levels.
 */
export default function ProgressScreen() {
  const router = useRouter();
  const theme = useThemeColors();
  const { state } = useAppState();
  const [filter, setFilter] = useState<WordFilter>('all');

  const summary = useProgressSummary();
  const counts = useStatusCounts();
  const myWords = useTouchedWords(filter);

  const weekTotal = summary.data?.weeklyMinutes.reduce((sum, value) => sum + value, 0) ?? 0;
  const goalPercent = Math.min(
    100,
    Math.round(((summary.data?.studiedToday ?? 0) / (summary.data?.dailyGoal ?? 20)) * 100),
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Progress" onBack={() => router.push('/')} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {summary.isPending ? (
          <SkeletonList rows={2} />
        ) : summary.isError ? (
          <ErrorState onRetry={() => summary.refetch()} />
        ) : (
          <View style={styles.tiles}>
            <StatTile icon="time-outline" tone="ink" value={weekTotal} label="minutes this week" />
            <StatTile icon="flame" tone="flame" value={summary.data.streak} label="day streak" />
          </View>
        )}

        <Card>
          <View style={styles.cardHeader}>
            <AppText variant="label" bold style={styles.cardTitle}>
              This week&apos;s study history
            </AppText>
            <AppText variant="caption" muted>
              (mins)
            </AppText>
          </View>
          {summary.data ? <WeekChart minutes={summary.data.weeklyMinutes} /> : <SkeletonList rows={1} />}
        </Card>

        <Card>
          <View style={styles.cardHeader}>
            <View style={styles.goalLabel}>
              <Ionicons name="flag-outline" size={16} color={theme.mutedForeground} />
              <AppText variant="label" bold style={styles.cardTitle}>
                Daily goal
              </AppText>
            </View>
            <AppText variant="label" muted>
              {summary.data?.studiedToday ?? 0} / {summary.data?.dailyGoal ?? 20} words
            </AppText>
          </View>
          <ProgressBar value={goalPercent} />
        </Card>

        <AppText variant="overline" muted style={styles.sectionLabel}>
          Level completion
        </AppText>
        <View style={styles.list}>
          {levels.map((level) => (
            <LevelCompletionRow key={level.id} levelId={level.id} name={level.name} />
          ))}
        </View>

        <AppText variant="overline" muted style={styles.sectionLabel}>
          Word status
        </AppText>
        {counts.isPending ? (
          <SkeletonList rows={1} />
        ) : (
          <View style={styles.statusRow}>
            <StatusCount tone="sageSoft" text="sage" value={counts.data?.mastered ?? 0} label="Mastered" />
            <StatusCount tone="honeySoft" text="honey" value={counts.data?.learning ?? 0} label="Learning" />
            <StatusCount tone="muted" text="mutedForeground" value={counts.data?.fresh ?? 0} label="New" />
          </View>
        )}

        <View style={[styles.totalRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="book-outline" size={16} color={theme.mutedForeground} />
          <AppText variant="label" muted>
            <AppText variant="label" bold style={{ color: theme.foreground }}>
              {state.masteredCount}
            </AppText>{' '}
            words mastered in total
          </AppText>
        </View>

        <AppText variant="overline" muted style={styles.sectionLabel}>
          My words
        </AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {filters.map((item) => {
            const active = filter === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setFilter(item.id)}
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: theme.primary }
                    : { backgroundColor: theme.card, borderColor: theme.border },
                  !active && styles.chipBordered,
                ]}
              >
                <AppText
                  variant="label"
                  style={{
                    color: active ? theme.primaryForeground : theme.mutedForeground,
                    fontWeight: '600',
                  }}
                >
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        {myWords.isPending ? (
          <SkeletonList rows={3} />
        ) : myWords.isError ? (
          <ErrorState onRetry={() => myWords.refetch()} />
        ) : myWords.data.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            hint={
              filter === 'favorites'
                ? 'Tap the bookmark on a card to save words you want to revisit.'
                : 'Study some words and they will show up here.'
            }
          />
        ) : (
          <View style={styles.list}>
            {myWords.data.map((word) => (
              <WordRow
                key={word.id}
                word={word}
                status={state.status[word.id] ?? 'new'}
                favorite={state.favorites.includes(word.id)}
                onPress={() =>
                  router.push({
                    pathname: '/study',
                    params: { level: word.level, start: word.id },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/** One level completion row — reads its own progress query to stay in sync. */
function LevelCompletionRow({ levelId, name }: { levelId: LevelId; name: string }) {
  const router = useRouter();
  const theme = useThemeColors();
  const { state } = useAppState();
  const progress = useLevelProgress(levelId);
  const data = progress.data ?? levelProgress(state.status, levelId);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/browse/[level]', params: { level: levelId } })}
      style={({ pressed }) => [
        styles.levelRow,
        { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={styles.levelRowTop}>
        <AppText variant="label" bold style={styles.levelRowName}>
          {name}
        </AppText>
        <AppText variant="label" muted>
          {data.mastered} / {data.total}
        </AppText>
        <Ionicons name="chevron-forward" size={16} color={theme.mutedForeground} />
      </View>
      <ProgressBar value={data.percent} />
    </Pressable>
  );
}

function StatusCount({
  tone,
  text,
  value,
  label,
}: {
  tone: 'sageSoft' | 'honeySoft' | 'muted';
  text: 'sage' | 'honey' | 'mutedForeground';
  value: number;
  label: string;
}) {
  const theme = useThemeColors();
  return (
    <View style={[styles.statusBox, { backgroundColor: theme[tone], borderColor: theme.border }]}>
      <AppText variant="title" bold style={{ color: theme[text], fontSize: 20 }}>
        {value}
      </AppText>
      <AppText variant="caption" style={{ color: theme[text], fontWeight: '500' }}>
        {label}
      </AppText>
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
    paddingBottom: Spacing.eight,
  },
  tiles: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  cardTitle: {
    fontSize: 16,
  },
  goalLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sectionLabel: {
    paddingHorizontal: Spacing.one,
    marginTop: Spacing.two,
  },
  list: {
    gap: Spacing.three - 2,
  },
  levelRow: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  levelRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  levelRowName: {
    flex: 1,
    fontSize: 16,
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
  statusBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.three + 2,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
  },
  chips: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  chipBordered: {
    borderWidth: 1,
  },
});
