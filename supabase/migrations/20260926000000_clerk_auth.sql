-- TagLingo — Phase 3: Clerk as Supabase third-party auth (native integration)
--
-- Supabase now verifies Clerk-issued session tokens against the Clerk JWKS
-- (configured in the dashboard: Supabase -> Authentication -> Sign In/Providers
-- -> Third Party Auth -> Clerk, pasting the Clerk instance domain). Those tokens
-- carry `"role": "authenticated"` and a `sub` claim equal to the Clerk user id
-- (e.g. `user_2xxxxxx`), which is NOT a Supabase Auth uuid — so the Phase 2
-- `auth.uid()` model no longer applies.
--
-- This migration moves ownership identity to the Clerk subject id:
--   * users.id becomes `text` (= Clerk sub), `clerk_id` is dropped (redundant)
--   * word_progress/study_sessions/quiz_attempts.user_id follow as `text`
--   * all RLS policies compare `id`/`user_id` to `auth.jwt()->>'sub'`
--   * a SECURITY DEFINER `ensure_user()` creates the users row on first login
--     (the authenticated role deliberately has no INSERT policy on users)

-- ──────────────────────────────────────────────── dependents first

-- Policies reference id/user_id and block the type change -> drop them now,
-- recreated below with the auth.jwt() comparison.
drop policy if exists "users: read own row" on public.users;
drop policy if exists "users: update own row" on public.users;
drop policy if exists "word_progress: manage own rows" on public.word_progress;
drop policy if exists "study_sessions: manage own rows" on public.study_sessions;
drop policy if exists "quiz_attempts: manage own rows" on public.quiz_attempts;

alter table public.word_progress drop constraint word_progress_user_id_fkey;
alter table public.study_sessions drop constraint study_sessions_user_id_fkey;
alter table public.quiz_attempts drop constraint quiz_attempts_user_id_fkey;

-- ──────────────────────────────────────────────── widen user ids to Clerk sub

alter table public.users alter column id type text using (id::text);
alter table public.users drop column clerk_id;

alter table public.word_progress alter column user_id type text using (user_id::text);
alter table public.study_sessions alter column user_id type text using (user_id::text);
alter table public.quiz_attempts alter column user_id type text using (user_id::text);

alter table public.word_progress
  add constraint word_progress_user_id_fkey
  foreign key (user_id) references public.users (id) on delete cascade;

alter table public.study_sessions
  add constraint study_sessions_user_id_fkey
  foreign key (user_id) references public.users (id) on delete cascade;

alter table public.quiz_attempts
  add constraint quiz_attempts_user_id_fkey
  foreign key (user_id) references public.users (id) on delete cascade;

comment on table public.users is
  'One row per account. id = Clerk subject id (auth.jwt()->>''sub''), matched directly by the RLS policies.';

-- ──────────────────────────────────────────────── RLS via auth.jwt()-sub

create policy "users: read own row"
  on public.users for select
  to authenticated
  using (id = auth.jwt() ->> 'sub');

create policy "users: update own row"
  on public.users for update
  to authenticated
  using (id = auth.jwt() ->> 'sub')
  with check (id = auth.jwt() ->> 'sub');

create policy "word_progress: manage own rows"
  on public.word_progress for all
  to authenticated
  using (user_id = auth.jwt() ->> 'sub')
  with check (user_id = auth.jwt() ->> 'sub');

create policy "study_sessions: manage own rows"
  on public.study_sessions for all
  to authenticated
  using (user_id = auth.jwt() ->> 'sub')
  with check (user_id = auth.jwt() ->> 'sub');

create policy "quiz_attempts: manage own rows"
  on public.quiz_attempts for all
  to authenticated
  using (user_id = auth.jwt() ->> 'sub')
  with check (user_id = auth.jwt() ->> 'sub');

-- ──────────────────────────────────────────────── first-login bootstrap

create or replace function public.ensure_user(
  p_full_name text default null,
  p_email text default null
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := nullif(auth.jwt() ->> 'sub', '');
  v_email text := coalesce(nullif(p_email, ''), nullif(auth.jwt() ->> 'email', ''), v_id);
  v_row public.users;
begin
  if v_id is null then
    raise exception 'request is not authenticated (no sub claim)';
  end if;

  insert into public.users (id, email, full_name)
  values (v_id, v_email, nullif(p_full_name, ''))
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.users.full_name)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.ensure_user(text, text) from public;
grant execute on function public.ensure_user(text, text) to authenticated;