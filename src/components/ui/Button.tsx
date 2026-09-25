import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

export type ButtonVariant = 'sage' | 'outline' | 'ghost' | 'soft';
export type ButtonSize = 'block' | 'sm' | 'iconRound';

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: object;
}

/**
 * TagLingo button — sage is the solid primary pill used for every main
 * action, outline sits on cream cards, ghost for quiet icon actions.
 */
export function Button({
  children,
  variant = 'sage',
  size = 'block',
  disabled = false,
  loading = false,
  onPress,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const theme = useThemeColors();
  const inactive = disabled || loading;

  const backgroundColor =
    variant === 'sage'
      ? theme.primary
      : variant === 'soft'
        ? theme.accent
        : variant === 'outline'
          ? theme.card
          : 'transparent';
  const borderColor = variant === 'outline' ? theme.border : 'transparent';
  const textColor =
    variant === 'sage'
      ? theme.primaryForeground
      : variant === 'soft'
        ? theme.accentForeground
        : variant === 'ghost'
          ? theme.mutedForeground
          : theme.foreground;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inactive }}
      onPress={inactive ? undefined : onPress}
      style={({ pressed }) => [
        styles.core,
        size === 'block' && styles.block,
        size === 'sm' && styles.sm,
        size === 'iconRound' && styles.iconRound,
        { backgroundColor, borderColor, opacity: inactive ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'outline' && styles.outlineBorder,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : typeof children === 'string' ? (
          <AppText variant="label" style={{ color: textColor, fontWeight: '600', fontSize: size === 'sm' ? 14 : 16 }}>
            {children}
          </AppText>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  core: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderRadius: Radius.lg,
  },
  block: {
    height: 56,
    paddingHorizontal: Spacing.six,
    alignSelf: 'stretch',
  },
  sm: {
    height: 40,
    paddingHorizontal: Spacing.four,
    alignSelf: 'flex-start',
  },
  iconRound: {
    height: 40,
    width: 40,
    borderRadius: Radius.pill,
  },
  outlineBorder: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
