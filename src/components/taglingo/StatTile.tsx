import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

export type StatTone = 'sage' | 'flame' | 'honey' | 'coral' | 'ink';

const tonePair: Record<StatTone, { bg: 'sageSoft' | 'flameSoft' | 'honeySoft' | 'coralSoft' | 'inkSoft'; fg: 'sage' | 'flame' | 'honey' | 'coral' | 'ink' }> = {
  sage: { bg: 'sageSoft', fg: 'sage' },
  flame: { bg: 'flameSoft', fg: 'flame' },
  honey: { bg: 'honeySoft', fg: 'honey' },
  coral: { bg: 'coralSoft', fg: 'coral' },
  ink: { bg: 'inkSoft', fg: 'ink' },
};

/** Compact stat block: tinted icon chip plus a big number and its label. */
export function StatTile({
  icon,
  value,
  label,
  tone = 'sage',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  tone?: StatTone;
}) {
  const theme = useThemeColors();
  const pair = tonePair[tone];

  return (
    <Card padding={Spacing.four} style={styles.tile}>
      <View style={[styles.chip, { backgroundColor: theme[pair.bg] }]}>
        <Ionicons name={icon} size={20} color={theme[pair.fg]} />
      </View>
      <AppText variant="display" bold style={styles.value}>
        {value}
      </AppText>
      <AppText variant="label" muted>
        {label}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    gap: Spacing.four,
    alignItems: 'flex-start',
  },
  chip: {
    height: 40,
    width: 40,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 32,
    lineHeight: 34,
  },
});
