import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ScreenHeader } from '@/components/taglingo/ScreenHeader';
import { StatTile } from '@/components/taglingo/StatTile';
import { WeekChart } from '@/components/taglingo/WeekChart';
import { Radius, Spacing } from '@/constants/theme';
import { useAppState } from '@/lib/app-state';
import { useAppAuth } from '@/lib/auth';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { formatTime } from '@/lib/utils';
import { useProgressSummary } from '@/features/progress/api';
import { useAuthUser } from '@/features/user/api';

/** Profile (functionality prompt §9): identity, stats, weekly history, account rows. */
export default function ProfileScreen() {
  const router = useRouter();
  const theme = useThemeColors();
  const { state } = useAppState();
  const auth = useAuthUser();
  const { signOut } = useAppAuth();
  const summary = useProgressSummary();

  const weekTotal = summary.data?.weeklyMinutes.reduce((sum, value) => sum + value, 0) ?? 0;

  const onLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Profile"
        right={
          <Pressable
            accessibilityLabel="Settings"
            accessibilityRole="button"
            onPress={() => router.push('/settings')}
            hitSlop={8}
            style={styles.headerIcon}
          >
            <Ionicons name="settings-outline" size={20} color={theme.mutedForeground} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <Avatar imageUrl={auth.avatarUrl} initials={auth.initials} size={96} />
          <AppText variant="display" bold style={styles.name}>
            {auth.name || 'TagLingo learner'}
          </AppText>
          <AppText variant="label" muted>
            {auth.email || 'you@example.com'}
          </AppText>
          <View style={[styles.sincePill, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <AppText variant="caption" muted>
              Learning since {auth.joined}
            </AppText>
          </View>
        </View>

        {summary.isPending ? (
          <SkeletonList rows={2} />
        ) : summary.isError ? (
          <ErrorState onRetry={() => summary.refetch()} />
        ) : (
          <View style={styles.tiles}>
            <StatTile
              icon="book-outline"
              tone="sage"
              value={summary.data.masteredCount}
              label="mastered words"
            />
            <StatTile icon="flame" tone="flame" value={summary.data.streak} label="day streak" />
          </View>
        )}

        <Card>
          <View style={styles.cardHeader}>
            <AppText variant="label" bold style={styles.cardTitle}>
              This week&apos;s study history
            </AppText>
            <AppText variant="caption" muted>
              {weekTotal} words
            </AppText>
          </View>
          {summary.data ? <WeekChart minutes={summary.data.weeklyMinutes} showMinutes={false} /> : null}
        </Card>

        <AppText variant="overline" muted style={styles.sectionLabel}>
          Your account
        </AppText>
        <View style={styles.list}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Ionicons name="notifications-outline" size={18} color={theme.mutedForeground} />
            <AppText variant="label" style={styles.rowLabel}>
              Study reminders
            </AppText>
            <AppText variant="label" muted>
              {state.reminder.enabled ? formatTime(state.reminder.time) : 'Off'}
            </AppText>
            <Ionicons name="chevron-forward" size={16} color={theme.mutedForeground} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onLogout}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color={theme.coral} />
            <AppText variant="label" style={[styles.rowLabel, { color: theme.coral }]}>
              Log out
            </AppText>
          </Pressable>
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
  identity: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    fontSize: 24,
    marginTop: Spacing.one,
  },
  sincePill: {
    marginTop: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: Spacing.one + 2,
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
  sectionLabel: {
    paddingHorizontal: Spacing.one,
    marginTop: Spacing.two,
  },
  list: {
    gap: Spacing.three - 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
  },
});
