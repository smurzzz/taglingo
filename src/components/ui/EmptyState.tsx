import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

/** Dashed-border card shown when a filtered list has nothing to render. */
export function EmptyState({
  title,
  hint,
  icon = 'file-tray-outline',
}: {
  title: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const theme = useThemeColors();

  return (
    <View style={[styles.core, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <Ionicons name={icon} size={26} color={theme.mutedForeground} />
      <AppText variant="label" bold style={styles.title}>
        {title}
      </AppText>
      {hint ? (
        <AppText variant="label" muted center style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  core: {
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.ten,
  },
  title: {
    fontSize: 16,
  },
  hint: {
    maxWidth: 280,
  },
});
