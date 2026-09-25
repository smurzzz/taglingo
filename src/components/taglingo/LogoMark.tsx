import { StyleSheet, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { AppText } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

/**
 * TagLingo mark: a line-art sprout in a pot, drawn with the same strokes as
 * the web prototype. `wilted` is the drooping variant used for paused/offline
 * states.
 */
export function SproutMark({
  size = 48,
  color,
  variant = 'healthy',
  style,
}: {
  size?: number;
  /** defaults to the theme primary (sage) */
  color?: string;
  variant?: 'healthy' | 'wilted';
  style?: object;
}) {
  const theme = useThemeColors();
  const stroke = color ?? theme.primary;
  const wilted = variant === 'wilted';

  return (
    <Svg width={size} height={size} viewBox="10 6 44 58" fill="none" style={style}>
      <G stroke={stroke} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        {wilted ? (
          <>
            {/* stem arching over, leaves hanging down — paused, not alarming */}
            <Path d="M26 46c0-12-2-20-8-24" />
            <Path d="M18 22c-7 3-10 10-8 16 5-4 7-11 8-16Z" fill={stroke} fillOpacity={0.22} />
            <Path d="M19 23c5 3 6 10 3 16-5-4-6-10-3-16Z" fill={stroke} fillOpacity={0.22} />
            <Path d="M27 42c0-8 3-13 9-15" />
            <Path d="M36 27c5 2 7 9 5 15-4-3-7-9-5-15Z" fill={stroke} fillOpacity={0.22} />
          </>
        ) : (
          <>
            <Path d="M32 46V33" />
            <Path d="M32 34c-9 0-14-5-14-15 10 0 14 6 14 15Z" fill={stroke} fillOpacity={0.22} />
            <Path d="M32 34c9 0 14-4 14-13-10 0-14 5-14 13Z" fill={stroke} fillOpacity={0.22} />
          </>
        )}

        <Path d="M18 44h28" />
        <Path
          d="M21 44h22l-2.6 15.4A2.6 2.6 0 0 1 37.8 62H26.2a2.6 2.6 0 0 1-2.6-2.6Z"
          fill={stroke}
          fillOpacity={0.08}
        />
      </G>
    </Svg>
  );
}

/** Logo lockup: sprout in an accent circle plus the wordmark and tagline. */
export function Logo({ tagline }: { tagline?: string }) {
  const theme = useThemeColors();

  return (
    <View style={styles.lockup}>
      <View style={[styles.badge, { backgroundColor: theme.accent }]}>
        <SproutMark size={48} />
      </View>
      <View style={styles.wordmark}>
        <AppText variant="hero" style={styles.name}>
          TagLingo
        </AppText>
        {tagline ? (
          <AppText variant="label" muted>
            {tagline}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  badge: {
    height: 80,
    width: 80,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
});
