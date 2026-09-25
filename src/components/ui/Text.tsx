import { StyleSheet, Text, type TextProps } from 'react-native';

import { Type, type PaletteColor } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

export type TextVariant = 'overline' | 'caption' | 'label' | 'body' | 'title' | 'display' | 'hero';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  /** Palette key used as the text color; defaults to foreground. */
  color?: PaletteColor;
  muted?: boolean;
  bold?: boolean;
  center?: boolean;
}

export function AppText({
  variant = 'body',
  color,
  muted = false,
  bold = false,
  center = false,
  style,
  ...rest
}: AppTextProps) {
  const theme = useThemeColors();
  const resolvedColor = color ?? (muted ? 'mutedForeground' : 'foreground');

  return (
    <Text
      style={[
        styles.base,
        Type[variant],
        { color: theme[resolvedColor] },
        center && styles.center,
        bold && styles.bold,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: undefined,
  },
  center: {
    textAlign: 'center',
  },
  bold: {
    fontWeight: '700',
  },
});
