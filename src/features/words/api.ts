import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export function useWordsCount() {
  return useQuery({
    queryKey: ['words', 'count'],
    enabled: supabase !== null,
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase is not configured');
      const { count, error } = await supabase
        .from('words')
        .select('id', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}
