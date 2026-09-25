import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/Text';
import { SproutMark } from '@/components/taglingo/LogoMark';
import { Spacing } from '@/constants/theme';
import { useAppState } from '@/lib/app-state';
import { useOnline } from '@/hooks/use-offline';

/**
 * Compact offline state, shown at the top of screens that keep working.
 * The offline screen itself is a full page; this is the gentler variant.
 */
export function OfflineBanner() {
  const online = useOnline();
  const { actions } = useAppState();
  const [checking, setChecking] = useState(false);

  const handleRetry = () => {
    if (checking) return;
    if (online) {
      actions.dismissOffline();
      return;
    }
    setChecking(true);
    setTimeout(() => setChecking(false), 1200);
  };

  return (
    <Card tone="sageSoft" padding={Spacing.four}>
      <View style={styles.row}>
        <SproutMark variant="wilted" size={32} />
        <AppText variant="label" style={styles.message}>
          You&apos;re offline — progress will sync when you reconnect.
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try again"
          onPress={handleRetry}
          hitSlop={8}
          style={styles.retry}
        >
          {checking ? (
            <ActivityIndicator size="small" />
          ) : (
            <AppText variant="label" color="primary" bold>
              Try again
            </AppText>
          )}
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  message: {
    flex: 1,
    fontSize: 14,
  },
  retry: {
    minWidth: 64,
    alignItems: 'center',
  },
});
