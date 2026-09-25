import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

/** Non-blocking error card with a retry action — never a dead end. */
export function ErrorState({
  onRetry,
  message = 'Something went wrong while loading this.',
}: {
  onRetry: () => void;
  message?: string;
}) {
  const theme = useThemeColors();

  return (
    <View style={[styles.core, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <Ionicons name="cloud-offline-outline" size={26} color={theme.coral} />
      <AppText variant="label" bold style={styles.title}>
        Couldn&apos;t load this
      </AppText>
      <AppText variant="label" muted center style={styles.message}>
        {message}
      </AppText>
      <Button variant="outline" size="sm" onPress={onRetry}>
        Try again
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  core: {
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.ten,
  },
  title: {
    fontSize: 16,
  },
  message: {
    maxWidth: 280,
  },
});
