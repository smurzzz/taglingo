import { Colors, type Palette } from '@/constants/theme';
import { useAppState } from '@/lib/app-state';

/** Active palette — the Settings dark-mode toggle overrides the system scheme. */
export function useThemeColors(): Palette {
  const { state } = useAppState();
  return state.darkMode ? Colors.dark : Colors.light;
}
