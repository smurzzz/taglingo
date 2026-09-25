import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { SproutMark } from '@/components/taglingo/LogoMark';
import { Radius, Spacing } from '@/constants/theme';
import { useAppState } from '@/lib/app-state';
import { useOnline } from '@/hooks/use-offline';
import { useThemeColors } from '@/hooks/use-theme-colors';

/**
 * Full-screen offline state: informative, never alarming. The bottom
 * navigation stays visible but muted so the rest of the app reads as paused.
 */
export function OfflineView() {
  const router = useRouter();
  const online = useOnline();
  const theme = useThemeColors();
  const { state, actions } = useAppState();
  const [retrying, setRetrying] = useState(false);
  const [stillOffline, setStillOffline] = useState(false);

  const goHome = () => {
    router.replace('/');
  };

  const handleRetry = () => {
    // in the demo the switch stands in for a dead connection
    if (state.simulateOffline) {
      actions.setSimulateOffline(false);
      goHome();
      return;
    }

    if (online) {
      goHome();
      return;
    }

    setRetrying(true);
    setStillOffline(false);
    setTimeout(() => {
      setRetrying(false);
      setStillOffline(true);
    }, 1200);
  };

  return (
    <View style={styles.core}>
      <View style={styles.illustration}>
        <SproutMark variant="wilted" size={160} />
        <View style={[styles.wifiBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="cloud-offline-outline" size={24} color={theme.mutedForeground} />
        </View>
        <View style={[styles.groundLine, { backgroundColor: theme.border }]} />
      </View>

      <AppText variant="display" bold style={styles.title}>
        You&apos;re offline
      </AppText>
      <AppText variant="label" muted center style={styles.message}>
        TagLingo needs an internet connection to sync your progress. Reconnect to keep studying.
      </AppText>

      <Button variant="sage" onPress={handleRetry} loading={retrying} style={styles.retry}>
        {retrying ? ' ' : 'Try again'}
      </Button>
      {stillOffline ? (
        <AppText variant="caption" muted style={styles.stillOffline}>
          Still offline — check your connection and try again.
        </AppText>
      ) : null}

      <View style={[styles.safeNote, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="lock-closed-outline" size={16} color={theme.mutedForeground} />
        <AppText variant="label" muted>
          Your saved words are safe on this device.
        </AppText>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          actions.dismissOffline();
          goHome();
        }}
        hitSlop={8}
      >
        <AppText variant="label" muted bold>
          Keep browsing
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  core: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.seven,
    gap: Spacing.three,
  },
  illustration: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.ten,
  },
  wifiBadge: {
    position: 'absolute',
    top: -Spacing.two,
    right: -Spacing.eight,
    height: 56,
    width: 56,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groundLine: {
    position: 'absolute',
    bottom: -Spacing.four,
    width: 160,
    height: 1,
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    marginTop: Spacing.three,
  },
  message: {
    maxWidth: 300,
    textAlign: 'center',
  },
  retry: {
    marginTop: Spacing.four,
    alignSelf: 'stretch',
  },
  stillOffline: {
    marginTop: Spacing.two,
  },
  safeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
    marginTop: Spacing.four,
  },
});
