import { useAuth } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useWordsCount } from '@/features/words/api';
import { backendConfig } from '@/lib/env';

function SupabaseStatusCard() {
  const { data, isPending, isError, refetch, isRefetching } = useWordsCount();

  if (!backendConfig.supabase) {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">Supabase: not configured</ThemedText>
        <ThemedText type="small">
          Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env, then restart
          with `npx expo start -c`.
        </ThemedText>
      </ThemedView>
    );
  }
  if (isPending || isRefetching) {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <ActivityIndicator />
        <ThemedText type="small">Checking Supabase connection…</ThemedText>
      </ThemedView>
    );
  }
  if (isError) {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">Supabase: unreachable</ThemedText>
        <ThemedText type="small">
          Check the keys in .env. If the keys are right, the `words` table may not exist yet (it
          is created in Phase 2).
        </ThemedText>
        <Link href="/" onPress={() => refetch()}>
          <ThemedText type="linkPrimary">Try again</ThemedText>
        </Link>
      </ThemedView>
    );
  }
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">Supabase: connected</ThemedText>
      <ThemedText type="small">{data} words in the database.</ThemedText>
    </ThemedView>
  );
}

function ClerkStatusCard() {
  const { isSignedIn, userId } = useAuth();

  if (isSignedIn) {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">Clerk: signed in</ThemedText>
        <ThemedText type="small">Session active for user {userId}.</ThemedText>
      </ThemedView>
    );
  }
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">Clerk: signed out</ThemedText>
      <Link href="/sign-in">
        <ThemedText type="linkPrimary">Open the sign-in screen</ThemedText>
      </Link>
    </ThemedView>
  );
}

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">TagLingo</ThemedText>
        <ThemedText type="small" style={styles.tagline}>
          Phase 0 — environment check
        </ThemedText>
        <SupabaseStatusCard />
        {backendConfig.clerk ? (
          <ClerkStatusCard />
        ) : (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Clerk: not configured</ThemedText>
            <ThemedText type="small">
              Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to .env, then restart with `npx expo start
              -c`.
            </ThemedText>
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
  tagline: {
    textAlign: 'center',
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
