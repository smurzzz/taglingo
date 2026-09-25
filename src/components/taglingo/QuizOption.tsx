import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

export type OptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed';

/** One multiple-choice answer: letter chip, label, correct/incorrect marker. */
export function QuizOption({
  letter,
  label,
  state,
  disabled = false,
  onPress,
}: {
  letter: string;
  label: string;
  state: OptionState;
  disabled?: boolean;
  onPress?: () => void;
}) {
  const theme = useThemeColors();

  const backgroundColor =
    state === 'correct'
      ? theme.sageSoft
      : state === 'wrong'
        ? theme.coralSoft
        : state === 'selected'
          ? theme.accent
          : theme.card;
  const borderColor =
    state === 'correct'
      ? theme.sage
      : state === 'wrong'
        ? theme.coral
        : state === 'selected'
          ? theme.primary
          : theme.border;
  const textColor =
    state === 'correct'
      ? theme.sage
      : state === 'wrong'
        ? theme.coral
        : state === 'dimmed'
          ? theme.mutedForeground
          : theme.foreground;
  const markerBorder =
    state === 'correct'
      ? theme.sage
      : state === 'wrong'
        ? theme.coral
        : state === 'selected'
          ? theme.primary
          : theme.border;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: state === 'selected' }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.core,
        {
          backgroundColor,
          borderColor,
          opacity: state === 'dimmed' ? 0.6 : pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={[styles.marker, { borderColor: markerBorder }]}>
        <AppText variant="caption" style={{ color: textColor, fontWeight: '700' }}>
          {letter}
        </AppText>
      </View>
      <AppText variant="label" style={[styles.label, { color: textColor }]}>
        {label}
      </AppText>
      {state === 'correct' ? <Ionicons name="checkmark-circle" size={20} color={theme.sage} /> : null}
      {state === 'wrong' ? <Ionicons name="close-circle" size={20} color={theme.coral} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  core: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three + 2,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  marker: {
    height: 28,
    width: 28,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 15,
  },
});
