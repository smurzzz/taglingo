/**
 * Daily study reminder — Phase 6. A local, repeating `expo-notifications`
 * notification that fires once a day at `users.reminder_time` (Settings →
 * Study reminders). The schedule is reconciled purely from the (persisted)
 * app state: enabling or changing the time schedules a new DAILY trigger under
 * a fixed identifier; disabling cancels it. Mock/no-keys mode works too —
 * local notifications need no backend.
 *
 * Docs: 02-ARCHITECTURE.md §9; SDK 57 expo-notifications uses
 * `SchedulableTriggerInputTypes.DAILY` with `hour`/`minute` + a channel.
 */

import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useAppState } from '@/lib/app-state';

/** Fixed identifier so rescheduling replaces, never stacks, reminders. */
export const REMINDER_IDENTIFIER = 'daily-study-reminder';

/** Android channel (required for the permission prompt and reliable delivery). */
export const REMINDER_CHANNEL = 'study-reminders';

// Present scheduled notifications while the app is foregrounded too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
    name: 'Study reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#208AEF',
  });
}

/** `reminder_time` ("HH:MM") -> hour/minute used by the DAILY trigger. */
function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number);
  return {
    hour: Number.isNaN(hour) ? 19 : Math.min(23, Math.max(0, hour)),
    minute: Number.isNaN(minute) ? 30 : Math.min(59, Math.max(0, minute)),
  };
}

export async function getReminderPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  return (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

/** Asks the OS (Android 13+/iOS) once, right when the user flips the toggle. */
export async function requestReminderPermission(): Promise<boolean> {
  if (await getReminderPermission()) return true;
  await ensureChannel();
  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

/** Schedule (or cancel) the daily reminder to match the current settings. */
export async function scheduleDailyReminder(
  enabled: boolean,
  time: string,
): Promise<void> {
  if (!enabled) {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER).catch(
      () => undefined,
    );
    return;
  }
  await ensureChannel();
  const { hour, minute } = parseTime(time);
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_IDENTIFIER,
    content: {
      title: 'A quick session keeps your streak alive',
      body: "Tap to review today's words in TagLingo.",
      data: { url: '/', kind: 'study-reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: REMINDER_CHANNEL,
    },
  });
}

/**
 * Reconciles the scheduled notification with `state.reminder` — runs at boot
 * once the persisted preference is applied and on every Settings change.
 */
export function useReminderNotification(): void {
  const { state } = useAppState();
  const { enabled, time } = state.reminder;

  useEffect(() => {
    void scheduleDailyReminder(enabled, time);
  }, [enabled, time]);
}