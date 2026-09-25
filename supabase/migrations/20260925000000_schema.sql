-- TagLingo — Phase 2: schema + row-level security
-- Mirrors docs/02-ARCHITECTURE.md §3 (data model) and §4 (RLS).
--
-- Apply order: 0001_schema.sql (this file) THEN 0002_seed_words.sql.
-- There is deliberately no DROP/CREATE OR REPLACE here — migrations are
-- up-only and applied against an empty database.
--
-- Auth note: TagLingo authenticates with Clerk (Phase 3), not Supabase Auth.
-- `auth.uid()` resolves to the `sub` claim of the JWT signed by the Clerk
-- JWKS configured as a Supabase Auth provider. `users.id` stores that same
-- Clerk subject id, so RLS compares `user_id = auth.uid()` directly.

-- ──────────────────────────────────────────────── kinds

do $$
begin
  create type public.level as enum ('Beginner', 'Intermediate', 'Advanced');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.word_status as enum ('learning', 'mastered');
exception
  when duplicate_object then null;
end $$;

-- ──────────────────────────────────────────────── users

create table public.users (
  id                uuid primary key,
  clerk_id          text unique not null,
  email             text unique not null,
  full_name         text,
  dark_mode         boolean not null default false,
  reminder_enabled  boolean not null default true,
  reminder_time     time not null default '19:30',
  created_at        timestamptz not null default now()
);

comment on table public.users is
  'One row per account. id = Clerk subject id (auth.uid()) so RLS can compare directly.';

alter table public.users enable row level security;

create policy "users: read own row"
  on public.users for select
  to authenticated
  using (id = auth.uid());

create policy "users: update own row"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- users is created first-login (Clerk webhook / app code, Phase 3); the
-- authenticated role has no insert policy by design.

-- ──────────────────────────────────────────────── words

create table public.words (
  id                 uuid primary key default gen_random_uuid(),
  tagalog            text not null,
  cebuano            text not null,
  english            text not null,
  level              public.level not null,
  example_sentence   text,
  audio_url          text,
  created_at         timestamptz not null default now()
);

create index words_level_idx on public.words (level);
create index words_english_idx on public.words (lower(english));

alter table public.words enable row level security;

create policy "words: read for authenticated"
  on public.words for select
  to authenticated
  using (true);

-- No insert/update/delete policy exists and no grant is given — vocabulary
-- is read-only for every client role and seeded via migration (0002) or a
-- service-role import.

revoke all on public.words from anon, authenticated;
grant select on public.words to authenticated;

-- ──────────────────────────────────────────────── word_progress

create table public.word_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  word_id      uuid not null references public.words (id) on delete cascade,
  status       public.word_status not null default 'learning',
  is_favorite  boolean not null default false,
  updated_at   timestamptz not null default now(),
  unique (user_id, word_id)
);

create index word_progress_user_idx on public.word_progress (user_id);
create index word_progress_word_idx on public.word_progress (word_id);

alter table public.word_progress enable row level security;

create policy "word_progress: manage own rows"
  on public.word_progress for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ──────────────────────────────────────────────── study_sessions

create table public.study_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  studied_on  date not null,
  created_at  timestamptz not null default now(),
  unique (user_id, studied_on)
);

create index study_sessions_user_idx on public.study_sessions (user_id);

alter table public.study_sessions enable row level security;

create policy "study_sessions: manage own rows"
  on public.study_sessions for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ──────────────────────────────────────────────── quiz_attempts

create table public.quiz_attempts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users (id) on delete cascade,
  level             public.level not null,
  score             integer not null check (score >= 0),
  total_questions   integer not null default 10 check (total_questions > 0),
  missed_word_ids   jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now()
);

create index quiz_attempts_user_idx on public.quiz_attempts (user_id);
create index quiz_attempts_level_idx on public.quiz_attempts (level);

alter table public.quiz_attempts enable row level security;

create policy "quiz_attempts: manage own rows"
  on public.quiz_attempts for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ──────────────────────────────────────────────── triggers

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger word_progress_set_updated_at
  before update on public.word_progress
  for each row execute function public.set_updated_at();