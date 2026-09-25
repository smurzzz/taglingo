import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { todayIndex, WEEK_LABELS } from '@/lib/derived';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { withAlpha } from '@/lib/utils';

/** Seven-day bar chart; today's bar is highlighted. */
export function WeekChart({
  minutes,
  showMinutes = true,
}: {
  minutes: number[];
  showMinutes?: boolean;
}) {
  const theme = useThemeColors();
  const peak = Math.max(...minutes, 1);
  const today = todayIndex();

  return (
    <View style={styles.row}>
      {minutes.map((value, index) => {
        const heightPct = Math.max(8, (value / peak) * 100);
        const isToday = index === today;
        return (
          <View key={`${WEEK_LABELS[index]}-${index}`} style={styles.column}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${heightPct}%`,
                    backgroundColor: isToday
                      ? theme.primary
                      : withAlpha(theme.primary, 0.35),
                  },
                ]}
              />
            </View>
            {showMinutes ? (
              <AppText variant="caption" muted style={styles.minutes}>
                {value}
              </AppText>
            ) : null}
            <AppText
              variant="caption"
              style={{ color: isToday ? theme.primary : theme.mutedForeground, fontWeight: '600' }}
            >
              {WEEK_LABELS[index]}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.one + 2,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  barTrack: {
    height: 96,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 10,
    borderRadius: Radius.pill,
  },
  minutes: {
    fontSize: 11,
  },
});
