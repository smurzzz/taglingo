import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppStateProvider, useAppState } from '@/lib/app-state';
import { useIsOffline } from '@/hooks/use-offline';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { backendConfig, env } from '@/lib/env';

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
  const { state, actions } = useAppState();
  const offline = useIsOffline();

  useEffect(() => {
    if (!state.user && pathname !== '/login') {
      router.replace('/login');
      return;
    }
    if (state.user && pathname === '/login') {
      router.replace('/');
    }
  }, [state.user, pathname, router]);

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

function RootNavigator() {
  const theme = useThemeColors();

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
