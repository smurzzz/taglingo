import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SearchBar } from '@/components/ui/SearchBar';
import { SkeletonList } from '@/components/ui/Skeleton';
import { LevelCard } from '@/components/taglingo/LevelCard';
import { ScreenHeader } from '@/components/taglingo/ScreenHeader';
import { OfflineBanner } from '@/components/taglingo/OfflineBanner';
import { WordRow } from '@/components/taglingo/WordRow';
import { Spacing } from '@/constants/theme';
import { useIsOffline } from '@/hooks/use-offline';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { levelProgress } from '@/lib/derived';
import { useAllWords, useLevels } from '@/features/words/api';
import { useProgressSnapshot } from '@/features/progress/api';
import type { LevelId } from '@/mocks/words';

/**
 * Browse by Level (functionality prompt §3): level cards with live
 * completion, plus an optional search that filters words across all levels
 * by Tagalog/Cebuano/English spelling.
 */
export default function BrowseScreen() {
  const router = useRouter();
  const theme = useThemeColors();
  const offline = useIsOffline();
  const [query, setQuery] = useState('');

  const levels = useLevels();
  const allWords = useAllWords();
  const snapshot = useProgressSnapshot();

  const status = snapshot.data?.status ?? {};
  const favorites = snapshot.data?.favorites ?? [];

  const trimmed = query.trim().toLowerCase();
  const searching = trimmed.length > 0;

  const results = useMemo(() => {
    if (!searching) return [];
    return (allWords.data ?? []).filter(
      (word) =>
        word.tagalog.toLowerCase().includes(trimmed) ||
        word.cebuano.toLowerCase().includes(trimmed) ||
        word.english.toLowerCase().includes(trimmed),
    );
  }, [allWords.data, searching, trimmed]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Browse by level" onBack={() => router.push('/')} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SearchBar value={query} onChangeText={setQuery} />

        {offline && !searching ? <OfflineBanner /> : null}

        {searching ? (
          <>
            <AppText variant="overline" muted style={styles.sectionLabel}>
              {results.length} {results.length === 1 ? 'word' : 'words'}
            </AppText>
            {allWords.isPending ? (
              <SkeletonList rows={3} />
            ) : results.length === 0 ? (
              <EmptyState
                title="No words found"
                hint="Try a different spelling in Tagalog, Cebuano or English."
                icon="search-outline"
              />
            ) : (
              <View style={styles.list}>
                {results.map((word) => (
                  <WordRow
                    key={word.id}
                    word={word}
                    status={status[word.id] ?? 'new'}
                    favorite={favorites.includes(word.id)}
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
          </>
        ) : (
          <>
            <AppText variant="overline" muted style={styles.sectionLabel}>
              Choose where to study
            </AppText>

            {levels.isPending ? (
              <SkeletonList rows={3} />
            ) : levels.isError ? (
              <ErrorState onRetry={() => levels.refetch()} />
            ) : (
              <View style={styles.list}>
                {levels.data.map((level) => (
                  <LevelCard
                    key={level.id}
                    level={level}
                    progress={levelProgress(status, level.id as LevelId)}
                    onPress={() =>
                      router.push({
                        pathname: '/browse/[level]',
                        params: { level: level.id },
                      })
                    }
                  />
                ))}
              </View>
            )}
          </>
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
  sectionLabel: {
    paddingHorizontal: Spacing.one,
    marginTop: Spacing.one,
  },
  list: {
    gap: Spacing.three,
  },
});
