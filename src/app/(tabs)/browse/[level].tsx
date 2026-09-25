import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ScreenHeader } from '@/components/taglingo/ScreenHeader';
import { WordRow } from '@/components/taglingo/WordRow';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { filterWords, useWordsByLevel, type WordFilter } from '@/features/words/api';
import { useLevelProgress, useProgressSnapshot } from '@/features/progress/api';
import { getLevel } from '@/mocks/decks';

const filters: { id: WordFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'mastered', label: 'Mastered' },
  { id: 'learning', label: 'Learning' },
  { id: 'favorites', label: 'Favorites' },
];

/**
 * Level-scoped view (functionality prompt §3): summary plus both Study and
 * Quiz entry points, and the per-level word list with status filters.
 */
export default function LevelWordsScreen() {
  const router = useRouter();
  const theme = useThemeColors();
  const params = useLocalSearchParams<{ level?: string }>();
  const level = getLevel(params.level);
  const [filter, setFilter] = useState<WordFilter>('all');

  const words = useWordsByLevel(level.id);
  const progress = useLevelProgress(level.id);
  const snapshot = useProgressSnapshot();

  const status = snapshot.data?.status ?? {};
  const favorites = snapshot.data?.favorites ?? [];

  const rows = filterWords(
    words.data ?? [],
    filter,
    status,
    favorites,
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="My words"
        onBack={() => router.push('/browse')}
        right={
          <Pressable
            accessibilityLabel="Search words"
            accessibilityRole="button"
            onPress={() => router.push('/browse')}
            hitSlop={8}
            style={styles.headerIcon}
          >
            <Ionicons name="search-outline" size={20} color={theme.mutedForeground} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.summary, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.summaryTop}>
            <AppText variant="title" bold style={styles.summaryName}>
              {level.name}
            </AppText>
            <AppText variant="label" muted>
              {level.vocabulary} words
            </AppText>
          </View>
          <AppText variant="label" muted style={styles.summaryProgress}>
            <AppText variant="label" bold>
              {progress.data?.mastered ?? 0}
            </AppText>{' '}
            of {progress.data?.total ?? 0} in this deck mastered
          </AppText>

          <View style={styles.entries}>
            <Button
              variant="sage"
              size="sm"
              onPress={() => router.push({ pathname: '/study', params: { level: level.id } })}
              style={styles.entryButton}
            >
              <View style={styles.entryContent}>
                <Ionicons name="book-outline" size={16} color={theme.primaryForeground} />
                <AppText variant="label" style={{ color: theme.primaryForeground, fontWeight: '600' }}>
                  Study
                </AppText>
              </View>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => router.push({ pathname: '/quiz', params: { level: level.id } })}
              style={styles.entryButton}
            >
              <View style={styles.entryContent}>
                <Ionicons name="list" size={16} color={theme.foreground} />
                <AppText variant="label" style={{ fontWeight: '600' }}>
                  Quiz
                </AppText>
              </View>
            </Button>
          </View>
        </View>

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

        <AppText variant="overline" muted style={styles.sectionLabel}>
          {rows.length} {rows.length === 1 ? 'word' : 'words'}
        </AppText>

        {words.isPending ? (
          <SkeletonList rows={4} />
        ) : words.isError ? (
          <ErrorState onRetry={() => words.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            hint={
              filter === 'favorites'
                ? 'Tap the bookmark on a card to save words you want to revisit.'
                : 'Study this level and these words will show up here.'
            }
          />
        ) : (
          <View style={styles.list}>
            {rows.map((word) => (
              <WordRow
                key={word.id}
                word={word}
                status={status[word.id] ?? 'new'}
                favorite={favorites.includes(word.id)}
                onPress={() =>
                  router.push({
                    pathname: '/study',
                    params: { level: level.id, start: word.id },
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.eight,
  },
  headerIcon: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.two,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  summaryName: {
    fontSize: 18,
  },
  summaryProgress: {
    fontSize: 14,
  },
  entries: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  entryButton: {
    flex: 1,
    alignSelf: 'auto',
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
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
  sectionLabel: {
    paddingHorizontal: Spacing.one,
    marginTop: Spacing.one,
  },
  list: {
    gap: Spacing.three - 2,
  },
});
