import { zodResolver } from '@hookform/resolvers/zod';
import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Alert, Button, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { backendConfig } from '@/lib/env';

const signInSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignInValues = z.infer<typeof signInSchema>;

function SignInForm() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async ({ email, password }: SignInValues) => {
    if (!isLoaded) return;
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace('/');
      } else {
        Alert.alert('Sign-in incomplete', `Status: ${result.status}. Try again.`);
      }
    } catch {
      Alert.alert('Sign-in failed', 'Check your credentials and try again.');
    }
  };

  return (
    <ThemedView style={styles.form}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            autoCapitalize="none"
            keyboardType="email-address"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.email && <ThemedText type="small">{errors.email.message}</ThemedText>}
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.password && <ThemedText type="small">{errors.password.message}</ThemedText>}
      <Button
        title={isSubmitting ? 'Signing in…' : 'Sign in'}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting || !isLoaded}
      />
    </ThemedView>
  );
}

export default function SignInScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">Sign in to TagLingo</ThemedText>
        {backendConfig.clerk ? (
          <SignInForm />
        ) : (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Clerk is not configured</ThemedText>
            <ThemedText type="small">
              Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to .env (see .env.example), enable the Email
              strategy in your Clerk project, then restart with `npx expo start -c`.
            </ThemedText>
            <Link href="/">
              <ThemedText type="linkPrimary">Back to home</ThemedText>
            </Link>
          </ThemedView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    justifyContent: 'center',
  },
  form: {
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: Spacing.two,
    padding: Spacing.two,
    fontSize: 16,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
