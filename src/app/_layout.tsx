import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname, useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppStateProvider, useAppState } from '@/lib/app-state';
import { useAppAuth } from '@/lib/auth';
import { useIsOffline } from '@/hooks/use-offline';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { backendConfig, env } from '@/lib/env';
import { useEnsureUser } from '@/features/user/api';
import { loadNotifications, useReminderNotification } from '@/features/notifications/api';

const queryClient = new QueryClient();

// React Query treats app connectivity as the NetInfo signal, so queries that
// failed while offline refetch automatically the moment the network returns
// (functionality prompt §11 — no manual retry).
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(state.isConnected ?? true)),
);

/**
 * App-wide navigation rules (ported from the web prototype's AppGate):
 * - signed-out visitors land on the login screen
 * - losing the connection opens the full-screen offline state once; after
 *   "Keep browsing" the gentler banner takes over
 * - reconnecting from the offline screen returns to Home
 */
function AppGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAppAuth();
  const offline = useIsOffline();
  const { state, actions } = useAppState();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn && pathname !== '/login') {
      router.replace('/login');
      return;
    }
    if (isSignedIn && pathname === '/login') {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, pathname, router]);

  useEffect(() => {
    if (offline && !state.offlineDismissed && pathname !== '/offline') {
      router.replace('/offline');
      return;
    }
    if (!offline && pathname === '/offline') {
      router.replace('/');
      return;
    }
    if (!offline && state.offlineDismissed) {
      actions.resetOfflineDismissed();
    }
  }, [offline, state.offlineDismissed, pathname, router, actions]);

  return null;
}

/**
 * Creates the users row on first login and applies the persisted account
 * preferences (dark mode, reminder) from that row to the live app state.
 */
function UserBootstrapper() {
  const { isLoaded, isSignedIn } = useAppAuth();
  const ensureUser = useEnsureUser();
  const { actions } = useAppState();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (ensureUser.isIdle && backendConfig.clerk) {
      ensureUser.mutate();
    }
  }, [isLoaded, isSignedIn, ensureUser]);

  useEffect(() => {
    if (ensureUser.isSuccess && ensureUser.data) {
      actions.applyAccountPreferences({
        darkMode: ensureUser.data.dark_mode,
        reminder: {
          enabled: ensureUser.data.reminder_enabled,
          time: ensureUser.data.reminder_time,
        },
      });
    }
  }, [ensureUser.isSuccess, ensureUser.data, actions]);

  return null;
}

/**
 * Deep-links the daily reminder tap back into Home (data.url = "/").
 * Uses an event listener instead of `useLastNotificationResponse` because the
 * notifications module is only available on runtimes with its native code
 * (Expo Go can't import it since SDK 53).
 */
function useNotificationResponseListener() {
  const router = useRouter();

  useEffect(() => {
    let unsubscribe: { remove(): void } | undefined;
    void loadNotifications().then((Notifications) => {
      if (!Notifications) return;
      unsubscribe = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const url = response.notification.request.content.data?.url;
          if (
            response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER &&
            typeof url === 'string'
          ) {
            router.replace(url as Href);
          }
        },
      );
    });
    return () => unsubscribe?.remove();
  }, [router]);

  return null;
}

function LoadingScreen() {
  const theme = useThemeColors();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.background,
      }}
    >
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}

function RootNavigator() {
  const theme = useThemeColors();
  const { isLoaded } = useAppAuth();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="sso-callback" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="quiz" />
        <Stack.Screen name="quiz-results" />
        <Stack.Screen name="offline" />
      </Stack>
      <StatusBar style={theme.background === '#12191C' ? 'light' : 'dark'} />
      <UserBootstrapper />
      <AppGate />
      <ReminderSync />
    </>
  );
}

/** Keeps the scheduled daily reminder in sync with the persisted preference. */
function ReminderSync() {
  useReminderNotification();
  useNotificationResponseListener();
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        {backendConfig.clerk ? (
          <ClerkProvider publishableKey={env.clerkPublishableKey} tokenCache={tokenCache}>
            <AppStateProvider>
              <RootNavigator />
            </AppStateProvider>
          </ClerkProvider>
        ) : (
          <AppStateProvider>
            <RootNavigator />
          </AppStateProvider>
        )}
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}