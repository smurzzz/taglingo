import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Spacing, type PaletteColor } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

export interface CardProps {
  children: ReactNode;
  /** Soft tint surface — sageSoft/honeySoft/coralSoft/inkSoft/muted. */
  tone?: PaletteColor;
  padding?: number;
  radius?: number;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  tone = 'card',
  padding = Spacing.five,
  radius = Radius.xl,
  bordered = true,
  style,
}: CardProps) {
  const theme = useThemeColors();
  return (
    <View
      style={[
        styles.core,
        {
          backgroundColor: theme[tone],
          borderRadius: radius,
          padding,
          borderColor: bordered ? theme.border : 'transparent',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  core: {
    borderWidth: 1,
  },
});
