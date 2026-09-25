import { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { Radius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

export type BarTone = 'sage' | 'honey' | 'ink' | 'coral';

/**
 * Progress track that grows from 0 on mount so progress reads as movement.
 * Width is measured on layout, then driven with the RN Animated API.
 */
export function ProgressBar({
  value,
  tone = 'sage',
  animate = true,
}: {
  value: number;
  tone?: BarTone;
  animate?: boolean;
}) {
  const theme = useThemeColors();
  const clamped = Math.max(0, Math.min(100, value));
  const [trackWidth, setTrackWidth] = useState(0);
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!animate) {
      progress.setValue(clamped);
      return;
    }
    Animated.timing(progress, {
      toValue: clamped,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [animate, clamped, progress]);

  const onLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const fillColor =
    tone === 'sage'
      ? theme.primary
      : tone === 'honey'
        ? theme.honey
        : tone === 'coral'
          ? theme.coral
          : theme.ink;
  const width = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 100],
        outputRange: [0, trackWidth],
        extrapolate: 'clamp',
      }),
    [progress, trackWidth],
  );

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={[styles.track, { backgroundColor: theme.muted }]}
      onLayout={onLayout}
    >
      <Animated.View style={[styles.fill, { backgroundColor: fillColor, width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    width: '100%',
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
});
