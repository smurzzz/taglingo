import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { useIsOffline } from '@/hooks/use-offline';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface Tab {
  label: string;
  path: '/' | '/browse' | '/study' | '/progress' | '/profile';
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}

const tabs: Tab[] = [
  { label: 'Home', path: '/', icon: 'home-outline', iconActive: 'home' },
  { label: 'Browse', path: '/browse', icon: 'search-outline', iconActive: 'search' },
  { label: 'Study', path: '/study', icon: 'book-outline', iconActive: 'book' },
  { label: 'Progress', path: '/progress', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
  { label: 'Profile', path: '/profile', icon: 'person-outline', iconActive: 'person' },
];

const isActive = (pathname: string, path: string) =>
  path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`);

interface BottomNavProps {
  /** offline state: still visible, visibly unavailable */
  muted?: boolean;
}

export function BottomNav({ muted = false }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const offline = useIsOffline();
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.nav,
        { backgroundColor: theme.card, borderColor: theme.border, opacity: muted ? 0.6 : 1 },
      ]}
    >
      <View style={[styles.row, { paddingBottom: Math.max(insets.bottom, Spacing.two) }]}>
        {tabs.map((tab) => {
          const active = !muted && isActive(pathname, tab.path);
          const iconName = active ? tab.iconActive : tab.icon;

          return (
            <Pressable
              key={tab.path}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active, disabled: muted }}
              disabled={muted}
              onPress={() => {
                if (offline && !muted) {
                  router.push('/offline');
                  return;
                }
                router.push(tab.path);
              }}
              style={styles.tab}
            >
              <Ionicons
                name={iconName}
                size={22}
                color={active ? theme.primary : theme.mutedForeground}
              />
              <AppText
                variant="caption"
                style={[
                  styles.label,
                  { color: active ? theme.primary : theme.mutedForeground },
                  active && styles.labelActive,
                ]}
              >
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    borderTopWidth: 1,
  },
  row: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 16,
  },
  label: {
    fontSize: 11,
    lineHeight: 13,
  },
  labelActive: {
    fontWeight: '700',
  },
});
