import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { BottomNav } from '@/components/taglingo/BottomNav';
import { ScreenHeader } from '@/components/taglingo/ScreenHeader';
import { Radius, Spacing } from '@/constants/theme';
import { useAppState } from '@/lib/app-state';
import { useAppAuth } from '@/lib/auth';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { formatTime } from '@/lib/utils';
import { getReminderPermission, requestReminderPermission } from '@/features/notifications/api';
import { useUpdateAccountPreferences } from '@/features/user/api';

/** Theme preview tile — a tiny mock UI in light or dark. */
function ThemePreview({ mode, active, onSelect }: { mode: 'light' | 'dark'; active: boolean; onSelect: () => void }) {
  const theme = useThemeColors();
  const dark = mode === 'dark';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${dark ? 'Dark' : 'Light'} theme`}
      onPress={onSelect}
      style={[
        styles.previewCard,
        {
          borderColor: active ? theme.primary : theme.border,
          backgroundColor: theme.card,
        },
      ]}
    >
      <View
        style={[
          styles.previewScreen,
          dark
            ? { backgroundColor: '#12191C' }
            : { backgroundColor: '#FAF8F5' },
        ]}
      >
        <View style={styles.previewTop}>
          <Ionicons name={dark ? 'moon' : 'sunny'} size={14} color={dark ? '#E7CB7E' : '#9B7427'} />
          <View style={[styles.previewLine, { width: 32, backgroundColor: dark ? '#2D3539' : '#EAE7E1' }]} />
        </View>
        <View style={{ gap: 6 }}>
          <View style={[styles.previewLine, { width: 56, backgroundColor: dark ? '#2B3236' : '#EDF1F2' }]} />
          <View style={[styles.previewLine, { width: 40, backgroundColor: dark ? '#2B3236' : '#EDF1F2' }]} />
        </View>
      </View>
      <View style={styles.previewLabelRow}>
        {active ? <Ionicons name="checkmark" size={14} color={theme.primary} /> : null}
        <AppText variant="caption" style={{ fontWeight: '700' }}>
          {dark ? 'Dark' : 'Light'}
        </AppText>
      </View>
    </Pressable>
  );
}

/** Settings (functionality prompt §10): reminders, appearance, offline preview, log out. */
export default function SettingsScreen() {
  const router = useRouter();
  const theme = useThemeColors();
  const { state, actions } = useAppState();
  const { signOut } = useAppAuth();
  const persist = useUpdateAccountPreferences();
  const queryClient = useQueryClient();

  const applyReminder = (reminder: { enabled: boolean; time: string }) => {
    actions.setReminder(reminder);
    persist.mutate({ reminder_enabled: reminder.enabled, reminder_time: reminder.time });
  };
  const applyDarkMode = (value: boolean) => {
    actions.setDarkMode(value);
    persist.mutate({ dark_mode: value });
  };

  const [notificationsDenied, setNotificationsDenied] = useState(false);

  // refresh the denied hint from the real OS permission whenever a reminder is on
  useEffect(() => {
    if (!state.reminder.enabled) return;
    void getReminderPermission().then((granted) => setNotificationsDenied(!granted));
  }, [state.reminder.enabled]);

  // appearance previews never commit: tapping a tile only sets a transient
  // draft, discarded on leave — the switch is the single commit point (§10)
  const [draftMode, setDraftMode] = useState<'light' | 'dark'>(state.darkMode ? 'dark' : 'light');
  if (state.darkMode !== (draftMode === 'dark')) {
    setDraftMode(state.darkMode ? 'dark' : 'light');
  }

  const toggleReminder = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestReminderPermission();
      setNotificationsDenied(!granted);
      if (!granted) return; // keep the switch off until permissions allow it
    } else {
      setNotificationsDenied(false);
    }
    applyReminder({ ...state.reminder, enabled });
  };

  // native time picker — the OS dialog (Android) or in-line spinner (iOS)
  const [timeWheel, setTimeWheel] = useState(false);
  const [pendingTime, setPendingTime] = useState<Date | null>(null);

  const openTimePicker = () => {
    if (!state.reminder.enabled) return;
    const [h, m] = state.reminder.time.split(':').map(Number);
    const base = new Date();
    base.setHours(Number.isNaN(h) ? 19 : h, Number.isNaN(m) ? 30 : m, 0, 0);
    setPendingTime(base);
    setTimeWheel(true);
  };
  const commitTime = (date: Date) => {
    setTimeWheel(false);
    setPendingTime(null);
    const next = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    applyReminder({ ...state.reminder, time: next });
  };
  const onTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setTimeWheel(false);
      setPendingTime(null);
      if (event.type === 'set' && date) commitTime(date);
    } else if (date) {
      setPendingTime(date);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Settings" onBack={() => router.push('/profile')} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText variant="overline" muted style={styles.sectionLabel}>
          Study reminders
        </AppText>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <AppText variant="label" style={styles.rowTitle}>
                Daily reminder
              </AppText>
              <AppText variant="caption" muted>
                A gentle nudge to keep your streak
              </AppText>
            </View>
            <Switch
              value={state.reminder.enabled}
              onValueChange={toggleReminder}
              trackColor={{ false: theme.muted, true: theme.primary }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Daily reminder"
            />
          </View>

          {state.reminder.enabled && notificationsDenied ? (
            <View style={[styles.row, styles.rowBorder, { borderColor: theme.border }]}>
              <Ionicons name="notifications-off-outline" size={16} color={theme.coral} />
              <AppText variant="caption" muted style={styles.deniedHint}>
                Reminders need notification access, which Expo Go can&apos;t
                provide — enable them in your device settings, or run a
                development build to test reminders.
              </AppText>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Daily reminder time"
            disabled={!state.reminder.enabled}
            onPress={openTimePicker}
            style={({ pressed }) => [
              styles.row,
              styles.rowBorder,
              { borderColor: theme.border, opacity: state.reminder.enabled && !pressed ? 1 : 0.4 },
            ]}
          >
            <View style={styles.rowText}>
              <AppText variant="label" style={styles.rowTitle}>
                Daily reminder time
              </AppText>
              <AppText variant="caption" muted>
                {state.reminder.enabled
                  ? 'Pick a time for your nudge'
                  : 'Enable reminders to pick a time'}
              </AppText>
            </View>
            <View style={styles.timeValue}>
              <AppText variant="label" bold>
                {formatTime(state.reminder.time)}
              </AppText>
              <Ionicons name="chevron-forward" size={16} color={theme.mutedForeground} />
            </View>
          </Pressable>
        </View>

        {timeWheel && pendingTime ? (
          Platform.OS === 'ios' ? (
            <View style={[styles.timeSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.timeSheetHandle, { backgroundColor: theme.border }]} />
              <DateTimePicker
                value={pendingTime}
                mode="time"
                display="spinner"
                onChange={onTimeChange}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => commitTime(pendingTime)}
                hitSlop={8}
                style={styles.timeSheetDone}
              >
                <AppText variant="label" bold style={{ color: theme.primary }}>
                  Done
                </AppText>
              </Pressable>
            </View>
          ) : (
            <DateTimePicker value={pendingTime} mode="time" display="default" onChange={onTimeChange} />
          )
        ) : null}

        <AppText variant="overline" muted style={styles.sectionLabel}>
          Appearance
        </AppText>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.row}>
            <AppText variant="label" style={styles.rowTitle}>
              Dark mode
            </AppText>
            <Switch
              value={state.darkMode}
              onValueChange={(value) => {
                setDraftMode(value ? 'dark' : 'light');
                applyDarkMode(value);
              }}
              trackColor={{ false: theme.muted, true: theme.primary }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Dark mode"
            />
          </View>
          <View style={styles.previews}>
            <ThemePreview mode="light" active={draftMode === 'light'} onSelect={() => setDraftMode('light')} />
            <ThemePreview mode="dark" active={draftMode === 'dark'} onSelect={() => setDraftMode('dark')} />
          </View>
          <AppText variant="caption" muted style={styles.previewHint}>
            Tap a preview to try it on — flip the switch to keep your choice.
          </AppText>
        </View>

        <AppText variant="overline" muted style={styles.sectionLabel}>
          Connection
        </AppText>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.row}>
            <Ionicons name="cloud-offline-outline" size={18} color={theme.mutedForeground} />
            <View style={styles.rowText}>
              <AppText variant="label" style={styles.rowTitle}>
                Preview offline state
              </AppText>
              <AppText variant="caption" muted>
                Shows the offline screen and banner
              </AppText>
            </View>
            <Switch
              value={state.simulateOffline}
              onValueChange={actions.setSimulateOffline}
              trackColor={{ false: theme.muted, true: theme.primary }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Preview offline state"
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            queryClient.clear();
            await signOut();
            router.replace('/login');
          }}
          style={({ pressed }) => [
            styles.logout,
            { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.coral} />
          <AppText variant="label" style={[styles.rowTitle, { color: theme.coral }]}>
            Log out
          </AppText>
        </Pressable>
      </ScrollView>

      <BottomNav />
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
    marginTop: Spacing.two,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.five,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  rowBorder: {
    borderTopWidth: 1,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  timeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  timeSheet: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.two,
  },
  timeSheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 999,
  },
  timeSheetDone: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  deniedHint: {
    flex: 1,
  },
  previews: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  previewCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.two + 2,
  },
  previewScreen: {
    height: 80,
    borderRadius: Radius.md,
    padding: Spacing.three,
    justifyContent: 'space-between',
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewLine: {
    height: 6,
    borderRadius: 999,
  },
  previewLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.two,
  },
  previewHint: {
    paddingBottom: Spacing.four,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
    marginTop: Spacing.four,
  },
});
