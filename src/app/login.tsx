import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { Logo } from '@/components/taglingo/LogoMark';
import { Radius, Spacing } from '@/constants/theme';
import { useAppState } from '@/lib/app-state';
import { useThemeColors } from '@/hooks/use-theme-colors';

/**
 * Welcome / Login (functionality prompt §1). Phase 1 uses a mock sign-in —
 * any identity lands on the Home Dashboard; Phase 3 swaps these handlers for
 * real Clerk flows behind the same screen.
 */
export default function LoginScreen() {
  const router = useRouter();
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const { actions } = useAppState();
  const [email, setEmail] = useState('');

  const enter = () => {
    actions.signIn(email.trim());
    router.replace('/');
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Math.max(insets.bottom, Spacing.six) + Spacing.four },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Logo tagline="Learn words. Find your rhythm." />

          <View style={styles.form}>
            <View style={[styles.inputWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="mail-outline" size={18} color={theme.mutedForeground} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={theme.mutedForeground}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                returnKeyType="go"
                onSubmitEditing={enter}
                style={[styles.input, { color: theme.foreground }]}
              />
            </View>

            <Button variant="sage" onPress={enter}>
              Continue with email
            </Button>
          </View>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <AppText variant="caption" muted style={styles.dividerLabel}>
              OR
            </AppText>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          <View style={styles.socialRow}>
            <Button variant="outline" onPress={enter}>
              <View style={styles.socialButton}>
                <Ionicons name="logo-apple" size={18} color={theme.foreground} />
                <AppText variant="label" style={styles.socialLabel}>
                  Continue with Apple
                </AppText>
              </View>
            </Button>
            <Button variant="outline" onPress={enter}>
              <View style={styles.socialButton}>
                <Ionicons name="logo-google" size={18} color={theme.foreground} />
                <AppText variant="label" style={styles.socialLabel}>
                  Continue with Google
                </AppText>
              </View>
            </Button>
          </View>

          <AppText variant="caption" muted center style={styles.terms}>
            By continuing, you agree to our{'\n'}Terms of Use and Privacy Policy.
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.seven,
    paddingTop: Spacing.ten + Spacing.two,
    gap: Spacing.six,
  },
  form: {
    gap: Spacing.three,
    marginTop: Spacing.six,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    height: 56,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    letterSpacing: 2,
    fontWeight: '600',
  },
  socialRow: {
    gap: Spacing.three,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  socialLabel: {
    fontWeight: '600',
    fontSize: 16,
  },
  terms: {
    marginTop: 'auto',
    lineHeight: 18,
  },
});
