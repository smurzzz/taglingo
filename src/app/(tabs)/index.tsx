import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AppText } from '@/components/ui/Text';
import { SkeletonList } from '@/components/ui/Skeleton';
import { OfflineBanner } from '@/components/taglingo/OfflineBanner';
import { StatTile } from '@/components/taglingo/StatTile';
import { Radius, Spacing } from '@/constants/theme';
import { useAppState } from '@/lib/app-state';
import { useIsOffline } from '@/hooks/use-offline';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { levelProgress } from '@/lib/derived';
import { useLevels } from '@/features/words/api';
import { useProgressSummary } from '@/features/progress/api';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

/** Home Dashboard (functionality prompt §2): streak, mastery, resume, daily goal. */
export default function HomeScreen() {
  const router = useRouter();
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const { state } = useAppState();
  const offline = useIsOffline();

  const levels = useLevels();
  const summary = useProgressSummary();

  const refreshing = levels.isRefetching || summary.isRefetching;

  const currentLevel =
    levels.data?.find((level) => levelProgress(state.status, level.id).percent < 100) ??
    levels.data?.[0];
  const currentProgress = currentLevel
    ? levelProgress(state.status, currentLevel.id)
    : null;

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.three, paddingBottom: Spacing.eight },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              levels.refetch();
              summary.refetch();
            }}
            tintColor={theme.primary}
          />
        }
      >
        <View style={styles.header}>
          <Ionicons name="sunny-outline" size={24} color={theme.honey} />
          <AppText variant="title" bold style={styles.greeting} numberOfLines={1}>
            {greeting()}, {state.user?.name.split(' ')[0] ?? 'there'}
          </AppText>
          <Pressable
            accessibilityLabel="Notifications"
            accessibilityRole="button"
            onPress={() => router.push('/settings')}
            hitSlop={8}
            style={styles.bell}
          >
            <Ionicons name="notifications-outline" size={22} color={theme.foreground} />
            {state.reminder.enabled ? (
              <View style={[styles.bellDot, { backgroundColor: theme.coral }]} />
            ) : null}
          </Pressable>
        </View>

        {offline ? <OfflineBanner /> : null}

        {summary.isPending ? (
          <SkeletonList rows={2} />
        ) : summary.isError ? (
          <ErrorState onRetry={() => summary.refetch()} />
        ) : (
          <View style={styles.tiles}>
            <StatTile icon="flame" tone="flame" value={summary.data.streak} label="day streak" />
            <StatTile
              icon="book-outline"
              tone="sage"
              value={summary.data.masteredCount}
              label="mastered words"
            />
          </View>
        )}

        <Button
          variant="sage"
          onPress={() =>
            currentLevel &&
            router.push({ pathname: '/study', params: { level: currentLevel.id } })
          }
          disabled={!currentLevel}
        >
          <View style={styles.primaryButton}>
            <Ionicons name="play" size={16} color={theme.primaryForeground} />
            <AppText variant="label" style={[styles.primaryButtonLabel, { color: theme.primaryForeground }]}>
              Continue studying
            </AppText>
          </View>
        </Button>

        <Card>
          <AppText variant="title" bold style={styles.progressTitle}>
            You are {currentProgress?.percent ?? 0}% through {currentLevel?.name ?? 'Beginner'}.
          </AppText>
          <View style={styles.progressRow}>
            <ProgressBar value={currentProgress?.percent ?? 0} />
            <AppText variant="label" muted bold style={styles.progressValue}>
              {currentProgress?.percent ?? 0}%
            </AppText>
          </View>
        </Card>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/progress')}
          style={({ pressed }) => [
            styles.rowCard,
            { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <View style={styles.rowText}>
            <AppText variant="label" bold style={styles.rowTitle}>
              Daily goal
            </AppText>
            <AppText variant="label" muted>
              {summary.data?.studiedToday ?? 0} / {summary.data?.dailyGoal ?? 20} words
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.mutedForeground} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            currentLevel &&
            router.push({ pathname: '/quiz', params: { level: currentLevel.id } })
          }
          style={({ pressed }) => [
            styles.rowCard,
            { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <View style={[styles.quizChip, { backgroundColor: theme.sageSoft }]}>
            <Ionicons name="list" size={20} color={theme.sage} />
          </View>
          <View style={styles.rowText}>
            <AppText variant="label" bold style={styles.rowTitle}>
              Ready for a quiz?
            </AppText>
            <AppText variant="label" muted>
              10 questions on {currentLevel?.name.toLowerCase() ?? 'beginner'} words
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.mutedForeground} />
        </Pressable>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.one,
  },
  greeting: {
    flex: 1,
    fontSize: 22,
  },
  bell: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    height: 8,
    width: 8,
    borderRadius: 999,
  },
  tiles: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  primaryButtonLabel: {
    fontWeight: '600',
    fontSize: 16,
  },
  progressTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  progressValue: {
    minWidth: 40,
    textAlign: 'right',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three + 2,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  quizChip: {
    height: 40,
    width: 40,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
