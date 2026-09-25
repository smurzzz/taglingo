import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SearchBar } from '@/components/ui/SearchBar';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ScreenHeader } from '@/components/taglingo/ScreenHeader';
import { DefinitionSheet } from '@/components/taglingo/DefinitionSheet';
import { StatTile } from '@/components/taglingo/StatTile';
import { WeekChart } from '@/components/taglingo/WeekChart';
import { WordRow } from '@/components/taglingo/WordRow';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { levelProgress } from '@/lib/derived';
import { levels } from '@/mocks/decks';
import type { LevelId } from '@/mocks/words';
import {
  useLevelProgress,
  useProgressSnapshot,
  useProgressSummary,
  useStatusCounts,
  useToggleFavorite,
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
  const [filter, setFilter] = useState<WordFilter>('all');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  const summary = useProgressSummary();
  const counts = useStatusCounts();
  const myWords = useTouchedWords(filter);
  const snapshot = useProgressSnapshot();
  const toggleFavorite = useToggleFavorite();

  // ~300ms debounce so typing "Tagalog" doesn't re-render each keystroke (§8)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const isFavorite = (wordId: string) => snapshot.data?.favorites.includes(wordId) ?? false;
  const statusOf = (wordId: string) => snapshot.data?.status[wordId] ?? 'new';

  // newest-updated first, then narrowed by the debounced search spelling
  const visible = useMemo(() => {
    let list = [...(myWords.data ?? [])];
    const updated = snapshot.data?.updatedAt;
    if (updated) {
      list.sort((a, b) => (updated[b.id] ?? '').localeCompare(updated[a.id] ?? ''));
    }
    const q = debounced.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (word) =>
        word.tagalog.toLowerCase().includes(q) ||
        word.cebuano.toLowerCase().includes(q) ||
        word.english.toLowerCase().includes(q),
    );
  }, [myWords.data, snapshot.data?.updatedAt, debounced]);

  const detailWord = myWords.data?.find((word) => word.id === detailId);

  const weekTotal = summary.data?.weeklyMinutes.reduce((sum, value) => sum + value, 0) ?? 0;
  const goalPercent = Math.min(
    100,
    Math.round(((summary.data?.studiedToday ?? 0) / (summary.data?.dailyGoal ?? 20)) * 100),
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Progress"
        onBack={() => router.push('/')}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={searching ? 'Close search' : 'Search words'}
            onPress={() => {
              setSearching((value) => !value);
              setQuery('');
              setDebounced('');
            }}
            hitSlop={8}
            style={styles.headerIcon}
          >
            <Ionicons
              name={searching ? 'close' : 'search-outline'}
              size={20}
              color={theme.mutedForeground}
            />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {searching ? <SearchBar value={query} onChangeText={setQuery} /> : null}

        {summary.isPending ? (
          <SkeletonList rows={2} />
        ) : summary.isError ? (
          <ErrorState onRetry={() => summary.refetch()} />
        ) : (
          <View style={styles.tiles}>
            <StatTile icon="time-outline" tone="ink" value={weekTotal} label="words this week" />
            <StatTile icon="flame" tone="flame" value={summary.data.streak} label="day streak" />
          </View>
        )}

        <Card>
          <View style={styles.cardHeader}>
            <AppText variant="label" bold style={styles.cardTitle}>
              This week&apos;s study history
            </AppText>
            <AppText variant="caption" muted>
              (words)
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
              {summary.data?.masteredCount ?? 0}
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
        ) : visible.length === 0 ? (
          <EmptyState
            title="No matching words"
            hint="Try a different search or word filter."
          />
        ) : (
          <View style={styles.list}>
            {visible.map((word) => (
              <WordRow
                key={word.id}
                word={word}
                status={statusOf(word.id)}
                favorite={isFavorite(word.id)}
                onPress={() => setDetailId(word.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Read-only Word Detail — reuses the §5 Definition sheet; tapping a row
          never starts a study session. */}
      <DefinitionSheet
        word={detailWord}
        favorite={detailWord ? isFavorite(detailWord.id) : false}
        visible={!!detailId}
        status={detailWord ? statusOf(detailWord.id) : undefined}
        onToggleFavorite={() => {
          if (detailWord && !toggleFavorite.isPending) toggleFavorite.mutate(detailWord.id);
        }}
        onClose={() => setDetailId(null)}
      />
    </View>
  );
}

/** One level completion row — reads its own progress query to stay in sync. */
function LevelCompletionRow({ levelId, name }: { levelId: LevelId; name: string }) {
  const router = useRouter();
  const theme = useThemeColors();
  const snapshot = useProgressSnapshot();
  const progress = useLevelProgress(levelId);
  const data = progress.data ?? levelProgress(snapshot.data?.status ?? {}, levelId);

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
  headerIcon: {
    padding: Spacing.two,
  },
});
