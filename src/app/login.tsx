import { Ionicons } from '@expo/vector-icons';
import { useSignIn, useSignUp, useSSO, isClerkAPIResponseError } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { backendConfig } from '@/lib/env';
import { useThemeColors } from '@/hooks/use-theme-colors';

WebBrowser.maybeCompleteAuthSession();

/** Dev fallback when Clerk isn't configured — refuse gracefully instead of crashing. */
function AuthUnavailableScreen() {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Logo tagline="Learn words. Find your rhythm." />
        <View style={[styles.errorRow, { backgroundColor: theme.flameSoft }]}>
          <Ionicons name="construct-outline" size={16} color={theme.flame} />
          <AppText variant="caption" color="flame" style={styles.errorText}>
            Authentication is not configured yet. Add{' '}
            <AppText variant="caption" bold color="flame">
              EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
            </AppText>{' '}
            to your environment to enable sign-in.
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

export default function LoginScreen() {
  return backendConfig.clerk ? <ClerkLoginScreen /> : <AuthUnavailableScreen />;
}

/**
 * Welcome / Login (functionality prompt §1). Phase 3 replaces the mock
 * sign-in with real Clerk flows behind the same screen:
 *   - passwordless email code (auto sign-in for existing accounts, sign-up
 *     for new ones via the email_code strategy)
 *   - Apple / Google OAuth through the native SSO flow
 *   - on success, AppGate routes the authenticated session to Home
 */
function ClerkLoginScreen() {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const { signIn, setActive: setActiveFromSignIn } = useSignIn();
  const { signUp, setActive: setActiveFromSignUp } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [flow, setFlow] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [factor, setFactor] = useState<{ strategy: 'email_code'; emailAddressId: string } | null>(null);
  const [busy, setBusy] = useState<'none' | 'continue' | 'oauth'>('none');
  const [error, setError] = useState<string | null>(null);

  const dirty = busy !== 'none';

  const messageFor = (err: unknown): string => {
    if (isClerkAPIResponseError(err)) {
      const messages = err.errors
        .map((e) => e.longMessage ?? e.message)
        .filter(Boolean)
        .join(' ');
      return messages || 'Something went wrong. Please try again.';
    }
    return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
  };

  const hasError = (err: unknown, code: string): boolean =>
    isClerkAPIResponseError(err) && err.errors.some((e) => e.code === code);

  const continueWithEmail = async () => {
    const address = email.trim();
    if (!address) {
      setError('Enter your email to continue.');
      return;
    }
    if (!signIn || !signUp) {
      setError('Still getting ready — try again in a moment.');
      return;
    }
    setBusy('continue');
    setError(null);
    const startSignIn = async (id: string) => {
      const res = await signIn.create({ identifier: id });
      const emailCode = res.supportedFirstFactors?.find((f) => f.strategy === 'email_code');
      if (!emailCode) {
        setError('That account does not support email code sign-in.');
        return;
      }
      await signIn.prepareFirstFactor({ strategy: emailCode.strategy, emailAddressId: emailCode.emailAddressId });
      setFactor({ strategy: 'email_code', emailAddressId: emailCode.emailAddressId });
      setFlow('sign-in');
      setStage('code');
      setCode('');
    };
    try {
      await startSignIn(address);
    } catch (err) {
      if (hasError(err, 'form_identifier_not_found')) {
        try {
          await signUp.create({ emailAddress: address });
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          setFactor(null);
          setFlow('sign-up');
          setStage('code');
          setCode('');
        } catch (signUpErr) {
          if (hasError(signUpErr, 'form_identifier_exists')) {
            try {
              await startSignIn(address);
            } catch (transferErr) {
              setError(messageFor(transferErr));
            }
          } else {
            setError(messageFor(signUpErr));
          }
        }
      } else {
        setError(messageFor(err));
      }
    } finally {
      setBusy('none');
    }
  };

  const verifyCode = async () => {
    if (code.trim().length === 0) {
      setError('Enter the code you received by email.');
      return;
    }
    if (!signIn || !signUp) {
      setError('Still getting ready — try again in a moment.');
      return;
    }
    setBusy('continue');
    setError(null);
    try {
      if (flow === 'sign-up') {
        const res = await signUp.attemptEmailAddressVerification({ code: code.trim() });
        if (res.status === 'complete' && res.createdSessionId) {
          await setActiveFromSignUp({ session: res.createdSessionId });
          return;
        }
        setError('Verification incomplete — please try again.');
      } else {
        const res = await signIn.attemptFirstFactor({ strategy: 'email_code', code: code.trim() });
        if (res.status === 'complete' && res.createdSessionId) {
          await setActiveFromSignIn({ session: res.createdSessionId });
          return;
        }
        setError('That code did not match. Check the email and try again.');
      }
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy('none');
    }
  };

  const resendCode = async () => {
    if (!signIn || !signUp) {
      setError('Still getting ready — try again in a moment.');
      return;
    }
    setBusy('continue');
    setError(null);
    try {
      if (flow === 'sign-in') {
        if (!factor) throw new Error('No pending email code factor.');
        await signIn.prepareFirstFactor(factor);
      } else {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      }
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy('none');
    }
  };

  const startOAuth = async (strategy: 'oauth_apple' | 'oauth_google') => {
    setBusy('oauth');
    setError(null);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy('none');
    }
  };

  const focusedEmail = email.trim() || 'your email';

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

          {stage === 'email' ? (
            <View style={styles.form}>
              <View style={[styles.inputWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="mail-outline" size={18} color={theme.mutedForeground} />
                <TextInput
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    setError(null);
                  }}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.mutedForeground}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  returnKeyType="go"
                  onSubmitEditing={continueWithEmail}
                  style={[styles.input, { color: theme.foreground }]}
                />
              </View>

              <Button variant="sage" onPress={continueWithEmail} loading={busy === 'continue'} disabled={dirty}>
                Continue with email
              </Button>
            </View>
          ) : (
            <View style={styles.form}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to email"
                onPress={() => {
                  setStage('email');
                  setFactor(null);
                  setError(null);
                }}
                hitSlop={8}
                style={styles.backRow}
              >
                <Ionicons name="arrow-back" size={18} color={theme.mutedForeground} />
                <AppText variant="caption" muted>
                  Edit email
                </AppText>
              </Pressable>

              <AppText variant="label" bold center>
                Check {focusedEmail}
              </AppText>
              <AppText variant="caption" muted center style={styles.verifyHint}>
                Enter the 6-digit code from the email{'\n'}we just sent you.
              </AppText>

              <View style={[styles.inputWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="keypad-outline" size={18} color={theme.mutedForeground} />
                <TextInput
                  value={code}
                  onChangeText={(value) => {
                    setCode(value);
                    setError(null);
                  }}
                  placeholder="123456"
                  placeholderTextColor={theme.mutedForeground}
                  keyboardType="number-pad"
                  maxLength={8}
                  autoFocus
                  textContentType="oneTimeCode"
                  onSubmitEditing={verifyCode}
                  style={[styles.input, { color: theme.foreground }]}
                />
              </View>

              <Button variant="sage" onPress={verifyCode} loading={busy === 'continue'} disabled={dirty}>
                Verify &amp; continue
              </Button>

              <Pressable
                accessibilityRole="button"
                onPress={resendCode}
                disabled={dirty}
                hitSlop={8}
                style={styles.resend}
              >
                <AppText variant="label" muted style={[styles.resendLabel, busy === 'continue' && { opacity: 0.5 }]}>
                  Resend code
                </AppText>
              </Pressable>
            </View>
          )}

          {error ? (
            <View style={[styles.errorRow, { backgroundColor: theme.coralSoft }]}>
              <Ionicons name="alert-circle-outline" size={16} color={theme.coral} />
              <AppText variant="caption" color="coral" style={styles.errorText}>
                {error}
              </AppText>
            </View>
          ) : null}

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <AppText variant="caption" muted style={styles.dividerLabel}>
              OR
            </AppText>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          <View style={styles.socialRow}>
            <Button
              variant="outline"
              onPress={() => startOAuth('oauth_apple')}
              loading={busy === 'oauth'}
              disabled={dirty}
            >
              <View style={styles.socialButton}>
                <Ionicons name="logo-apple" size={18} color={theme.foreground} />
                <AppText variant="label" style={styles.socialLabel}>
                  Continue with Apple
                </AppText>
              </View>
            </Button>
            <Button
              variant="outline"
              onPress={() => startOAuth('oauth_google')}
              loading={busy === 'oauth'}
              disabled={dirty}
            >
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
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
  },
  verifyHint: {
    lineHeight: 18,
  },
  resend: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  resendLabel: {
    fontWeight: '600',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  errorText: {
    flex: 1,
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