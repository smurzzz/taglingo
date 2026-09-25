import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

/** Debounce-free controlled search field — filtering happens in the screen. */
export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search words…',
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  const theme = useThemeColors();

  return (
    <View style={[styles.core, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Ionicons name="search" size={18} color={theme.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.mutedForeground}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={[styles.input, { color: theme.foreground }]}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityLabel="Clear search"
          onPress={() => onChangeText('')}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={18} color={theme.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  core: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
});
