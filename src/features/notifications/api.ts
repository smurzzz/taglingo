/**
 * Daily study reminder — Phase 6. A local, repeating `expo-notifications`
 * notification that fires once a day at `users.reminder_time` (Settings →
 * Study reminders). The schedule is reconciled purely from the (persisted)
 * app state: enabling or changing the time schedules a new DAILY trigger under
 * a fixed identifier; disabling cancels it. Mock/no-keys mode works too —
 * local notifications need no backend.
 *
 * Expo Go compatibility: the `expo-notifications` native module was removed
 * from Expo Go in SDK 53, and even *importing* it throws at module scope. The
 * module is therefore loaded lazily and only on runtimes that include the
 * native code (dev/production builds / custom clients, detected via
 * `expo-constants`' execution environment). In Expo Go every exported function
 * is a safe no-op — reminders simply need a development build.
 *
 * Docs: 02-ARCHITECTURE.md §9; SDK 57 expo-notifications uses
 * `SchedulableTriggerInputTypes.DAILY` with `hour`/`minute` + a channel.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useAppState } from '@/lib/app-state';

/** Fixed identifier so rescheduling replaces, never stacks, reminders. */
export const REMINDER_IDENTIFIER = 'daily-study-reminder';

/** Android channel (required for the permission prompt and reliable delivery). */
export const REMINDER_CHANNEL = 'study-reminders';

/**
 * True when the running runtime ships the expo-notifications native module.
 * Expo Go (`StoreClient`) never does since SDK 53; everything else does.
 */
const notificationsAvailable =
  Platform.OS !== 'web' &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

let notificationsPromise: Promise<typeof import('expo-notifications') | null> | null = null;

/** Resolves to the expo-notifications module, or null where it can't load (Expo Go). */
export function loadNotifications(): Promise<typeof import('expo-notifications') | null> {
  if (!notificationsAvailable) return Promise.resolve(null);
  if (!notificationsPromise) {
    // Lazy dynamic import: in Expo Go this rejects (native module missing) and
    // is caught — it must never run at static module scope.
    notificationsPromise = import('expo-notifications').catch(() => null);
  }
  return notificationsPromise;
}

/** Present scheduled notifications while the app is foregrounded too (once). */
let handlerAttached = false;
async function ensureHandler(): Promise<void> {
  if (handlerAttached) return;
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  handlerAttached = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const Notifications = await loadNotifications();
  if (!Notifications) return;
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
  const Notifications = await loadNotifications();
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  return (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

/** Asks the OS (Android 13+/iOS) once, right when the user flips the toggle. */
export async function requestReminderPermission(): Promise<boolean> {
  if (await getReminderPermission()) return true;
  await Promise.all([ensureHandler(), ensureChannel()]);
  const Notifications = await loadNotifications();
  if (!Notifications) return false;
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
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  try {
    await ensureHandler();
    if (!enabled) {
      await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER);
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
  } catch {
    // A failed local schedule must never take the boot/settings flow down.
  }
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