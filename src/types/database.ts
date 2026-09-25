// TagLingo database types — mirror supabase/migrations/:
//   20260925000000_schema.sql (tables/RLS), 20260925000001_seed_words.sql,
//   20260926000000_clerk_auth.sql (Clerk sub as users.id, ensure_user RPC),
//   20260927000000_progress_word_status.sql (status 'new' value + default).
//
// Hand-maintained to match the applied schema. When a live Supabase project
// exists, regenerate the canonical copy with:
//   npx supabase gen types typescript --project-id <ref> --schema public > src/types/database.ts

import type { Level as PublicLevel } from '@/constants/levels';

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          dark_mode: boolean;
          reminder_enabled: boolean;
          reminder_time: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          dark_mode?: boolean;
          reminder_enabled?: boolean;
          reminder_time?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          dark_mode?: boolean;
          reminder_enabled?: boolean;
          reminder_time?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      words: {
        Row: {
          id: string;
          tagalog: string;
          cebuano: string;
          english: string;
          level: PublicLevel;
          example_sentence: string | null;
          audio_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tagalog: string;
          cebuano: string;
          english: string;
          level: PublicLevel;
          example_sentence?: string | null;
          audio_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tagalog?: string;
          cebuano?: string;
          english?: string;
          level?: PublicLevel;
          example_sentence?: string | null;
          audio_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      word_progress: {
        Row: {
          id: string;
          user_id: string;
          word_id: string;
          status: WordStatus;
          is_favorite: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          word_id: string;
          status?: WordStatus;
          is_favorite?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          word_id?: string;
          status?: WordStatus;
          is_favorite?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'word_progress_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'word_progress_word_id_fkey';
            columns: ['word_id'];
            isOneToOne: false;
            referencedRelation: 'words';
            referencedColumns: ['id'];
          },
        ];
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          studied_on: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          studied_on: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          studied_on?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'study_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          level: PublicLevel;
          score: number;
          total_questions: number;
          missed_word_ids: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          level: PublicLevel;
          score: number;
          total_questions?: number;
          missed_word_ids?: unknown;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          level?: PublicLevel;
          score?: number;
          total_questions?: number;
          missed_word_ids?: unknown;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quiz_attempts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      ensure_user: {
        Args: {
          p_full_name?: string | null;
          p_email?: string | null;
        };
        Returns: Database['public']['Tables']['users']['Row'];
      };
    };
    Enums: {
      level: PublicLevel;
      word_status: WordStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type WordStatus = 'learning' | 'mastered' | 'new';
export type Level = PublicLevel;