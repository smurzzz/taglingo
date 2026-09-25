import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

/** Placeholder block with a gentle pulse, used by every list screen's loading state. */
export function SkeletonBlock({
  width = '100%',
  height = 16,
  radius = Radius.md,
  style,
}: {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: object;
}) {
  const theme = useThemeColors();
  const [opacity] = useState(() => new Animated.Value(0.55));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.block,
        { width, height, borderRadius: radius, backgroundColor: theme.muted, opacity },
        style,
      ]}
    />
  );
}

/** Skeleton stand-in for the word/level list rows shown while a query is pending. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <View style={styles.list} accessibilityLabel="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.rowText}>
            <SkeletonBlock width="55%" height={18} radius={Radius.sm} />
            <SkeletonBlock width="35%" height={14} radius={Radius.sm} />
          </View>
          <SkeletonBlock width={72} height={22} radius={Radius.pill} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {},
  list: {
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  rowText: {
    flex: 1,
    gap: Spacing.two,
  },
});
