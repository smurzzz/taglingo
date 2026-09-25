/**
 * Auth facade (Phase 3) — one uniform hook for the whole app.
 *
 * When Clerk is configured (real `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`), it backs
 * onto `useAuth`/`useUser` from @clerk/clerk-expo (Core 2). Otherwise it falls
 * back to the Phase 1 mock session so the Screen/Library explorer still runs
 * without backend keys.
 *
 * Consumers never touch Clerk or the mock store directly:
 *   const { isLoaded, isSignedIn, userId, getToken, signOut, user } = useAppAuth();
 */

import { useAuth, useUser } from '@clerk/clerk-expo';

import { useAppState } from '@/lib/app-state';
import { backendConfig } from '@/lib/env';

export interface AuthUserIdentity {
  id: string | null;
  name: string;
  firstName: string;
  email: string;
  initials: string;
  avatarUrl: string | null;
  joined: string | null;
}

export interface AppAuthStatus {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
  user: AuthUserIdentity;
}

function useClerkAppAuth(): AppAuthStatus {
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useAuth();
  const { user: clerkUser } = useUser();

  const name = clerkUser?.fullName?.trim() ?? '';
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? '';
  const firstName = name.split(' ')[0] || email.split('@')[0] || 'there';
  const initials = name
    ? name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : (email[0]?.toUpperCase() ?? 'TL');

  return {
    isLoaded: Boolean(isLoaded),
    isSignedIn: Boolean(isSignedIn),
    userId: userId ?? null,
    getToken: async () => (await getToken()) ?? null,
    signOut: async () => {
      await signOut();
    },
    user: {
      id: clerkUser?.id ?? null,
      name,
      firstName,
      email,
      initials,
      avatarUrl: clerkUser?.imageUrl || null,
      joined: null,
    },
  };
}

function useMockAppAuth(): AppAuthStatus {
  const { state, actions } = useAppState();
  const user = state.user;

  const name = user?.name ?? '';
  const email = user?.email ?? '';

  return {
    isLoaded: true,
    isSignedIn: Boolean(user),
    userId: null,
    getToken: async () => null,
    signOut: async () => {
      actions.signOut();
    },
    user: {
      id: null,
      name,
      firstName: name.split(' ')[0] || 'there',
      email,
      initials: user?.initials ?? 'TL',
      avatarUrl: null,
      joined: user?.joined ?? null,
    },
  };
}

export const useAppAuth: () => AppAuthStatus = backendConfig.clerk
  ? useClerkAppAuth
  : useMockAppAuth;