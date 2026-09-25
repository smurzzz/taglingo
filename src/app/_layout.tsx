import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { backendConfig, env } from '@/lib/env';

const queryClient = new QueryClient();

function RootNavigator() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'TagLingo' }} />
      <Stack.Screen name="sign-in" options={{ title: 'Sign in', presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const content = (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RootNavigator />
      <StatusBar style="auto" />
    </ThemeProvider>
  );

  return (
    <QueryClientProvider client={queryClient}>
      {backendConfig.clerk ? (
        <ClerkProvider publishableKey={env.clerkPublishableKey} tokenCache={tokenCache}>
          {content}
        </ClerkProvider>
      ) : (
        content
      )}
    </QueryClientProvider>
  );
}
