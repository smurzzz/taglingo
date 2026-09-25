import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProgressBar, type BarTone } from '@/components/ui/ProgressBar';
import { AppText } from '@/components/ui/Text';
import { SproutMark } from '@/components/taglingo/LogoMark';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { LevelProgress } from '@/lib/derived';
import type { Level } from '@/mocks/decks';

const badgeTones: Record<string, { bg: 'sageSoft' | 'honeySoft' | 'inkSoft'; fg: 'sage' | 'honey' | 'ink' }> = {
  beginner: { bg: 'sageSoft', fg: 'sage' },
  intermediate: { bg: 'honeySoft', fg: 'honey' },
  advanced: { bg: 'inkSoft', fg: 'ink' },
};

const barTones: Record<string, BarTone> = {
  beginner: 'sage',
  intermediate: 'honey',
  advanced: 'ink',
};

const sproutSize: Record<string, number> = {
  beginner: 28,
  intermediate: 32,
  advanced: 36,
};

/** Level row on Browse by Level: sprout badge, word count, completion bar. */
export function LevelCard({
  level,
  progress,
  onPress,
}: {
  level: Level;
  progress: LevelProgress;
  onPress?: () => void;
}) {
  const theme = useThemeColors();
  const tones = badgeTones[level.id];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${level.name}, ${progress.percent}% complete`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.core,
        { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: theme[tones.bg] }]}>
          <SproutMark size={sproutSize[level.id]} color={theme[tones.fg]} />
        </View>

        <View style={styles.meta}>
          <AppText variant="title" bold style={styles.name}>
            {level.name}
          </AppText>
          <AppText variant="label" muted>
            {level.vocabulary} words
          </AppText>
        </View>

        <Ionicons name="chevron-forward" size={20} color={theme.mutedForeground} />
      </View>

      <View style={styles.progressArea}>
        <ProgressBar value={progress.percent} tone={barTones[level.id]} />
        <AppText variant="caption" muted style={styles.percent}>
          {progress.percent}% complete
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  core: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.four,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three + 2,
  },
  badge: {
    height: 48,
    width: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 18,
  },
  progressArea: {
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
  percent: {
    textAlign: 'right',
    fontWeight: '500',
  },
});
