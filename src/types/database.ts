// Phase 2 replaces this stub with generated types:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
import type { Level } from '@/constants/levels';

export interface WordRow {
  id: string;
  tagalog: string;
  cebuano: string;
  english: string;
  level: Level;
  example_sentence: string | null;
  audio_url: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      words: {
        Row: WordRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      level: Level;
    };
    CompositeTypes: Record<string, never>;
  };
}
