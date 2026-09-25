import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

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

function Stepper({
  value,
  onChange,
  minimum,
  maximum,
  step,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  minimum: number;
  maximum: number;
  step: number;
  disabled: boolean;
}) {
  const theme = useThemeColors();
  const clamp = (next: number) => Math.min(maximum, Math.max(minimum, next));
  const wrap = (next: number) => (next < minimum ? maximum : next > maximum ? minimum : next);

  return (
    <View style={[styles.stepper, { borderColor: theme.border, opacity: disabled ? 0.5 : 1 }]}>
      <Pressable
        accessibilityLabel="Decrease"
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => onChange(wrap(value - step))}
        hitSlop={8}
        style={styles.stepperButton}
      >
        <Ionicons name="remove" size={16} color={theme.foreground} />
      </Pressable>
      <AppText variant="label" bold style={styles.stepperValue}>
        {String(clamp(value)).padStart(2, '0')}
      </AppText>
      <Pressable
        accessibilityLabel="Increase"
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => onChange(wrap(value + step))}
        hitSlop={8}
        style={styles.stepperButton}
      >
        <Ionicons name="add" size={16} color={theme.foreground} />
      </Pressable>
    </View>
  );
}

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

  const [hours, minutes] = state.reminder.time.split(':').map(Number);
  const setTime = (nextHours: number, nextMinutes: number) =>
    applyReminder({
      ...state.reminder,
      time: `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`,
    });

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
                Notifications are blocked on your device. Enable them in Settings for
                daily reminders to appear.
              </AppText>
            </View>
          ) : null}

          <View style={[styles.row, styles.rowBorder, { borderColor: theme.border }]}>
            <AppText variant="label" style={styles.rowTitle}>
              Daily reminder time
            </AppText>
            <View style={styles.timeControls}>
              <Stepper
                value={Number.isNaN(hours) ? 19 : hours}
                onChange={(next) => setTime(next, Number.isNaN(minutes) ? 30 : minutes)}
                minimum={0}
                maximum={23}
                step={1}
                disabled={!state.reminder.enabled}
              />
              <AppText variant="label" muted bold>
                :
              </AppText>
              <Stepper
                value={Number.isNaN(minutes) ? 30 : minutes}
                onChange={(next) => setTime(Number.isNaN(hours) ? 19 : hours, next)}
                minimum={0}
                maximum={55}
                step={5}
                disabled={!state.reminder.enabled}
              />
              <AppText variant="caption" muted style={styles.timeHint}>
                {formatTime(state.reminder.time)}
              </AppText>
            </View>
          </View>
        </View>

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
              onValueChange={applyDarkMode}
              trackColor={{ false: theme.muted, true: theme.primary }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Dark mode"
            />
          </View>
          <View style={styles.previews}>
            <ThemePreview mode="light" active={!state.darkMode} onSelect={() => applyDarkMode(false)} />
            <ThemePreview mode="dark" active={state.darkMode} onSelect={() => applyDarkMode(true)} />
          </View>
          <AppText variant="caption" muted style={styles.previewHint}>
            Tap a preview to switch light or dark theme.
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
  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  stepperButton: {
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 24,
    textAlign: 'center',
  },
  timeHint: {
    minWidth: 64,
    textAlign: 'right',
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
