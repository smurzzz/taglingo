import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { useThemeColors } from '@/hooks/use-theme-colors';

/**
 * OAuth/SSO callback landing (Clerk `useSSO`). Clerk's `startSSOFlow` sends
 * the browser redirect to `AuthSession.makeRedirectUri({ path: 'sso-callback' })`
 * — Expo Go reopens the app on that path when Google/Apple sign-in finishes.
 * Without this file the path matches no route and Expo Router shows the
 * "Page could not be found" screen. The warm-path flow completes the session
 * through `startSSOFlow`'s `setActive`, after which AppGate routes to Home;
 * if no session ever arrives, AppGate bounces back to /login.
 */
export default function SSOCallbackScreen() {
  const theme = useThemeColors();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <AppText variant="label" muted style={styles.hint}>
        Finishing sign-in…
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  hint: {
    fontSize: 15,
  },
});