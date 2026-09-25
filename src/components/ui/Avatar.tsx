import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { useThemeColors } from '@/hooks/use-theme-colors';

/**
 * Avatar — the signed-in user's profile picture (Clerk `imageUrl`, which for
 * email sign-ups is the photo Google/Apple attached to the email account).
 * When no photo exists the initials tile renders instead, so every state is
 * covered without a placeholder flash.
 */
export function Avatar({ imageUrl, initials, size = 48 }: { imageUrl: string | null; initials: string; size?: number }) {
  const theme = useThemeColors();
  const fontSize = Math.max(12, Math.round(size * 0.34));

  if (!imageUrl) {
    return (
      <View
        accessibilityLabel="Profile picture"
        style={[
          styles.fallback,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.accent, borderColor: theme.border },
        ]}
      >
        <AppText bold style={{ color: theme.accentForeground, fontSize }}>
          {initials}
        </AppText>
      </View>
    );
  }

  return (
    <Image
      accessibilityLabel="Profile picture"
      source={{ uri: imageUrl }}
      cachePolicy="memory-disk"
      contentFit="cover"
      transition={150}
      style={{ width: size, height: size, borderRadius: size / 2, borderColor: theme.border }}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
