import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { AppText } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { Word, WordStatus } from '@/mocks/words';

/** One word in a list: Cebuano headword, English gloss, status badge. */
export function WordRow({
  word,
  status,
  favorite,
  onPress,
}: {
  word: Word;
  status: WordStatus;
  favorite: boolean;
  onPress?: () => void;
}) {
  const theme = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${word.cebuano}, ${word.english}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.core,
        { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={styles.text}>
        <AppText variant="label" bold numberOfLines={1} style={styles.headword}>
          {word.cebuano}
        </AppText>
        <AppText variant="label" muted numberOfLines={1}>
          {word.english}
        </AppText>
      </View>

      <StatusBadge variant={favorite ? 'favorite' : status} />
      <Ionicons name="chevron-forward" size={16} color={theme.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  core: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  headword: {
    fontSize: 16,
  },
});
