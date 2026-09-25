import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname, useRouter } from 'expo-router';
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

const queryClient = new QueryClient();

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
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="quiz" />
        <Stack.Screen name="quiz-results" />
        <Stack.Screen name="offline" />
      </Stack>
      <StatusBar style={theme.background === '#12191C' ? 'light' : 'dark'} />
      <UserBootstrapper />
      <AppGate />
    </>
  );
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