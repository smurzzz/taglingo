import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { WordStatus } from '@/mocks/words';

export type BadgeVariant = WordStatus | 'favorite';

const label: Record<BadgeVariant, string> = {
  mastered: 'Mastered',
  learning: 'Learning',
  new: 'New',
  favorite: 'Favorite',
};

/** Word status pill — sage for mastered, honey for learning, coral for favorites. */
export function StatusBadge({
  variant,
  uppercase = false,
}: {
  variant: BadgeVariant;
  uppercase?: boolean;
}) {
  const theme = useThemeColors();
  const backgroundColor =
    variant === 'mastered'
      ? theme.sageSoft
      : variant === 'learning'
        ? theme.honeySoft
        : variant === 'favorite'
          ? theme.coralSoft
          : theme.muted;
  const textColor =
    variant === 'mastered'
      ? theme.sage
      : variant === 'learning'
        ? theme.honey
        : variant === 'favorite'
          ? theme.coral
          : theme.mutedForeground;

  return (
    <View style={[styles.core, { backgroundColor }]}>
      <AppText
        variant="caption"
        style={[styles.text, { color: textColor }, uppercase && styles.uppercase]}
      >
        {label[variant]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  core: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    fontSize: 12,
  },
  uppercase: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
