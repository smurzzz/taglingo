# TagLingo — Phase Plan

Sequential build plan: **Phase 0 sets up the environment, Phase 1 builds every screen with static/mock data (no backend), and every phase after that wires up the backend module by module.** This lets you demo the full click-through experience early, then make it real underneath.

Each phase has a goal, tasks, and an exit criterion — don't start the next phase until the current one's exit criterion is met.

---

## Phase 0 — Environment & Installation
**Goal:** a clean machine can go from nothing to a running (empty) app talking to real backend services.

- [x] Install Node.js LTS, a package manager (npm/yarn/pnpm — pick one), Expo CLI, EAS CLI (`npm install -g eas-cli`) — done: Node 22 LTS, npm, EAS CLI 23.2.0
- [ ] Run the app via Expo's own emulator/simulator (`npx expo start` → press `a` for Android or `i` for iOS) or Expo Go on a physical device — no separate Android Studio install needed
- [x] `npx create-expo-app taglingo --template` (TypeScript template)
- [x] Initialize `expo-router` navigation structure
- [x] Install dependencies: `@clerk/clerk-expo`, `@supabase/supabase-js`, `@tanstack/react-query`, `react-hook-form`, `zod`, `expo-notifications`
- [ ] Create Supabase project (URL + anon key), Clerk project (publishable key)
- [x] Create `.env` (uncommitted) and `.env.example` (committed) with the Supabase/Clerk keys
- [ ] `npx expo start` runs without error; a trivial Supabase query and a Clerk sign-in screen both work

**Exit criterion:** empty app runs, connects to Supabase, connects to Clerk.

---

## Phase 1 — All UI Screens (static, no backend)
**Goal:** every screen exists, is navigable, and looks correct — built against hardcoded/mock data, matching the 10 designed screens (+ offline state).

- [x] Shared components: `Card`, `WordCard` (flip), `LevelCard`, `StatusBadge`, `Button`, `BottomNav`, `SearchBar`
- [x] Mock fixtures: `/mocks/words.ts`, `/mocks/decks.ts`, `/mocks/progress.ts`
- [x] Screens: Welcome/Login, Home Dashboard, Browse by Level, Flashcard Study, Definition Lookup, Quiz Question, Quiz Results, Word Progress, Profile, Settings, Offline State
- [x] Every screen reachable from bottom nav / FAB / card taps
- [x] Empty and loading-skeleton states built for every list screen

**Exit criterion (met — 2026-09-25):** a reviewer can tap through the entire app, every screen, using only mock data — no dead ends. Verified: `expo lint`, `tsc --noEmit`, `expo-doctor` 21/21, Android export all clean.

---

## Phase 2 — Data Layer, Schema & Word Seeding
**Goal:** the database is live in Supabase and populated with real starting vocabulary before any screen is wired to it.

- [x] Create tables: `users`, `words` (tagalog, cebuano, english, level, example_sentence, audio_url), `word_progress` (user_id, word_id, status: mastered/learning/favorite), `quiz_attempts` — authored in `supabase/migrations/20260925000000_schema.sql` (renamed to CLI timestamp format; includes `study_sessions` per `02-ARCHITECTURE.md` §3.4). **Applied** to the live project `wvquienibojiphxamgnr` (taglingo) via the Supabase Management API on 2026-09-25; migration recorded in `supabase_migrations.schema_migrations` so `npx supabase db push` won't re-apply.
- [x] Set up RLS: a user can only read/write their own `word_progress` and `quiz_attempts`; `words` is read-only for authenticated clients (SELECT policy only, no write grants), writable only via direct DB/service-role import (no in-app admin panel, per project scope) — policies in `20260925000000_schema.sql`. Verified live end-to-end with a throwaway auth user (see `05-TESTING-REPORT.md` CP-01/CP-02).
- [x] **Seed the `words` table using `taglingo_words_template.csv`** — authored `supabase/migrations/20260925000001_seed_words.sql` (23 rows: Beginner 10 / Intermediate 8 / Advanced 5), generated programmatically from the CSV via `scripts/generate-words-seed.mjs` so it can't drift. **Applied** to the live project; confirmed 23 rows with the expected level split.
- [x] Verify seeded rows split correctly across levels (`SELECT level, count(*) FROM words GROUP BY level`) — **done 2026-09-25** on the live project: Beginner 10 / Intermediate 8 / Advanced 5.

**Exit criterion:** `words` table is live and seeded from the CSV, levels query returns the expected Beginner/Intermediate/Advanced counts, and RLS blocks a client from writing to another user's `word_progress`. **Status: MET** (verified live 2026-09-25 — see CP-01/CP-02 in `05-TESTING-REPORT.md`).

---

## Phase 3 — Auth & Roles (wire the real thing)
- [x] Replace mock "Continue with email/Apple/Google" with real Clerk auth — `src/app/login.tsx` now runs the Clerk custom flow (email-code sign-in/sign-up with automatic transfer handling) plus Apple/Google via `useSSO()`. A thin `src/lib/auth.tsx` facade feeds Clerk state to screens; the mock store remains only as a no-keys dev fallback.
- [x] Create `users` row on first login — `ensure_user()` SECURITY DEFINER RPC (`supabase/migrations/20260926000000_clerk_auth.sql`), called by `UserBootstrapper` in `src/app/_layout.tsx` after sign-in; id = Clerk `sub`.
- [x] Profile screen reads real session data — `useAuthUser()` (`src/features/user/api.ts`) merges Clerk identity with the persisted `users` row; initials/name/email/"Learning since" all live.
- [x] Settings screen (dark mode, reminder toggle) persists to `users` — `useUpdateAccountPreferences()` writes `dark_mode`/`reminder_enabled`/`reminder_time` through RLS (own row only).

Schema: `20260926000000_clerk_auth.sql` (applied live 2026-09-26) widens `users.id`/FK `user_id` columns to `text` = Clerk subject id, drops the now-redundant `clerk_id`, and moves every RLS policy from `auth.uid()` to `auth.jwt()->>'sub'` so Supabase's Clerk third-party-auth provider (verifying Clerk-issued JWTs) gates rows correctly. Verified at the DB level with simulated JWT claims (ensure-user insert/first-login, own-row write, isolation, cross-user write blocked).

**Exit criterion:** a real account can log in, land on Home Dashboard, and Profile reflects real data. **Status: code + DB done; provider integration verified live; final device E2E pending** — both dashboard integrations are now confirmed: Supabase-side Third Party Auth entry is live via Management API (issuer `https://optimal-halibut-3418.clerk.accounts.dev`, type `clerk-development`, JWKS resolved on `GET /config/auth/third-party-auth`), and the Clerk-side "Connect with Supabase" was done by the user (stamps `role: authenticated` on session tokens). The only remaining step is signing in on a device.

Backend activation checklist (user, once):
1. ✅ **Clerk dashboard** → your application → **Connect with Supabase** (enables the Supabase integration that stamps `role: authenticated` onto session tokens).
2. ✅ **Supabase dashboard** → project `wvquienibojiphxamgnr` → Authentication → Sign In/Providers → **Third party auth** → **Add → Clerk** → pasted the Clerk instance domain `https://optimal-halibut-3418.clerk.accounts.dev`.
3. **Clerk dashboard** → Native applications → ensure **Native API** is enabled — applies to Apple/Google OAuth; email-code login works regardless.
4. **Clerk dashboard** → Redirect URLs — add the `taglingo://` custom-scheme callback URLs (and the Expo Go `exp://` URL for dev OAuth).

> Note: the registered TPA is a **development** Clerk instance (`clerk-development`). That's correct for Expo Go testing, but before release the prod Clerk instance needs its own Connect + TPA entries (Clerk rotates dev-account keys, and dev sessions/billing differ).

---

## Phase 4 — Flashcard Study & Progress (wire the real thing)
- [x] Browse by Level fetches real word counts and completion % per level from `word_progress`
- [x] Flashcard Study Mode fetches real words for the selected level
- [x] Mastered / Still Learning / Favorite writes to `word_progress`, synced in real time (Supabase)
- [x] Home Dashboard's streak and mastered-word count read real aggregated data
- [x] Word Progress screen (My Words) fetches real data, filterable by All/Mastered/Learning/Favorites

Schema: `20260927000000_progress_word_status.sql` (applied live 2026-09-27) adds a `'new'` status value to the `word_status` enum and makes it the `word_progress.status` default, so favorite-only rows stay clearly ungraded.

Implementation (2026-09-27):
- `src/features/words/api.ts` — `useLevels` (real vocabulary = per-level DB word counts), `useAllWords`, `useWordsByLevel` read the live `words` table through the Clerk-bound Supabase client; `mapWord` maps DB rows to the screen `Word` shape (part of speech / definition / example empty until Phase 5). Mock fixtures remain the fallback whenever Supabase or a Clerk session is unavailable.
- `src/features/progress/api.ts` — a single cached snapshot + summary/level/counts/touched views query the live `word_progress` (status/favorites/updated_at) and `study_sessions` (streak). Mutations `useGradeWord`, `useToggleFavorite`, `useRecordStudySession` write real rows (upserts on `user_id + word_id` / `user_id + studied_on`; favorite lifecycle keeps graded rows and deletes new-only rows) and invalidate the `progress`/`words` query keys so Home, Browse and My Words refresh without a manual pull.
- Screens rewired off the mock store: Study, Home Dashboard, Browse by Level, Level words, Progress and Profile (weekly history relabelled "words", not minutes).
- Every real-mode query keeps the seeded-mock behaviour as the no-keys/demo fallback.
- Verified: `tsc --noEmit`, `expo lint`, `expo-doctor` 21/21, and DB-level tests under simulated Clerk JWT claims (grade upsert, favorite-only insert, favorite-toggle lifecycle, study-session dedupe, cross-user isolation, cascade cleanup) — see CP-11/CP-12 in `05-TESTING-REPORT.md`.

**Exit criterion:** a word marked Mastered on the Study screen is reflected immediately on Home Dashboard and Word Progress without a manual refresh. **Status: code + DB done, RLS-verified live; final device E2E pending** (same device sign-in as Phase 3 — with no real `users`/`word_progress` rows yet, real-mode screens show empty starting progress until the first device login).

---

## Phase 5 — Definition Lookup & Quiz Mode (wire the real thing)
- [x] Definition Lookup calls the Free Dictionary API live on tap, renders definition/part of speech/example
- [x] Quiz Mode: generate a 10-question multiple-choice quiz from `words` at the selected level; distractors pulled from the same level
- [x] Quiz Results: score + missed-word list, "Review these" deep-links back into Study filtered to those words
- [x] Quiz attempts recorded in `quiz_attempts` (separate from `word_progress` — quiz results don't auto-mark a word Mastered, per the project's design decision)

**Exit criterion:** a full quiz can be taken end to end with a real score, and a missed word can be reviewed directly from the results screen.

---

## Phase 6 — Notifications & Offline State
- [x] Study reminder push notification (daily, time configurable in Settings)
- [x] Offline state screen/banner triggers correctly when connectivity drops, per the design
- [x] Expand seeded vocabulary from the Phase 2 CSV starting point toward the 200–300 word target across all three levels

**Exit criterion:** a scheduled reminder fires on a test device, and the app shows the offline state (not a blank/broken screen) when connectivity is cut. **Status: code + DB done; device verification pending** — the reminder schedule is local and needs a quick on-device confirmation, and offline-on-reconnect refetch needs a live network cut. Same device sign-in as Phase 3.

Implementation (2026-09-27):
- **Daily study reminder** — `src/features/notifications/api.ts` owns all notification logic: module-scope `setNotificationHandler`, an Android `study-reminders` channel, `getReminderPermission`/`requestReminderPermission` (consults PROVISIONAL on iOS), and `scheduleDailyReminder(enabled, time)` which schedules one DAILY trigger under the fixed id `daily-study-reminder` (or cancels it when disabled). `useReminderNotification()` reconciles the schedule with the persisted `users.reminder_*` preference; it's mounted in `src/app/_layout.tsx` via `<ReminderSync/>`, which also runs `useNotificationObserver` to deep-link the reminder tap back to Home. `src/app/settings.tsx` now requests OS permission the moment the toggle is switched on, stays off on denial, and shows a hint when the OS blocks notifications. Local scheduled notifications need no backend, so this works even in mock/no-keys mode.
- **Offline state** — the offline screen/banner and manual "simulate offline" already existed; the missing React Query wiring is now done: `onlineManager.setEventListener` bridges NetInfo so queries that failed offline **auto-refetch on reconnect** (functionality prompt §11 — no manual retry). Remote-signal checks in `src/app/_layout.tsx`.
- **Vocabulary expansion** — `docs/taglingo_words_template.csv` grew from 23 to **165 words** (Beginner 68 / Intermediate 61 / Advanced 36) across numbers, family/body, food, animals, colors, adjectives, verbs, time/days, weather, work/school, feelings, travel, health, and society/abstract terms. The seed migration `20260925000001_seed_words.sql` is frozen; the new `supabase/migrations/20260927000001_expand_vocabulary.sql` (generated by `scripts/generate-words-seed.mjs --write-expansion`) inserts only the delta and is idempotent via a natural-key unique index + `on conflict do nothing`. **Applied** live 2026-09-27; live counts verified: Beginner 68 / Intermediate 61 / Advanced 36. Remaining growth toward 200–300, plus a human translation-accuracy review, is deferred to Phase 7.
- Verified: `tsc --noEmit`, `expo lint`, `expo-doctor` 21/21.

---

## Phase 7 — Polish, Test, Submit
- [ ] Full click-through regression pass across both light/dark themes
- [ ] EAS Build → Android APK
- [ ] Rehearse demo: login → browse by level → study → quiz → results → progress sync
- [ ] Final proposal/documentation review

**Exit criterion:** installable APK, full demo runs start to finish, vocabulary dataset meets target word count.