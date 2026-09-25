import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

export interface ScreenHeaderProps {
  title?: string;
  onBack?: () => void;
  onClose?: () => void;
  right?: ReactNode;
}

/** Shared screen header: back/close affordance on the left, optional action on the right. */
export function ScreenHeader({ title, onBack, onClose, right }: ScreenHeaderProps) {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.core, { paddingTop: insets.top + Spacing.two }]}>
      {onBack ? (
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={onBack}
          hitSlop={8}
          style={styles.iconButton}
        >
          <Ionicons name="chevron-back" size={22} color={theme.foreground} />
        </Pressable>
      ) : null}
      {onClose ? (
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          onPress={onClose}
          hitSlop={8}
          style={styles.iconButton}
        >
          <Ionicons name="close" size={22} color={theme.foreground} />
        </Pressable>
      ) : null}

      <AppText variant="title" bold style={styles.title} numberOfLines={1}>
        {title}
      </AppText>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  core: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  iconButton: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  title: {
    flex: 1,
    fontSize: 18,
  },
  right: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
});
