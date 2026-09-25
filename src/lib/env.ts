const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

const isPlaceholder = (value: string) =>
  value === '' || value.includes('your-') || value.includes('your_');

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  clerkPublishableKey,
};

export const backendConfig = {
  supabase: !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey),
  clerk: !isPlaceholder(clerkPublishableKey),
} as const;
