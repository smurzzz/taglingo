import { createClient } from '@supabase/supabase-js';

import { backendConfig, env } from '@/lib/env';
import type { Database } from '@/types/database';

export const supabase = backendConfig.supabase
  ? createClient<Database>(env.supabaseUrl, env.supabaseAnonKey)
  : null;
