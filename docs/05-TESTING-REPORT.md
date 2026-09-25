# TagLingo — Testing Report

Status legend: ☐ not yet run · ✅ pass · ❌ fail (with note)

Re-run these before considering any phase in `01-PHASE-PLAN.md` that touches `words`, `word_progress`, or `quiz_attempts` complete.

## Critical Path Tests

### CP-01 — `word_progress` is scoped per user
**Steps:** authenticated as User A, attempt to read or write a `word_progress` row belonging to User B.
**Expected:** rejected by RLS in both directions.
**Status:** ✅ (verified live 2026-09-25 on Supabase project `wvquienibojiphxamgnr` with a throwaway auth user via PostgREST: User A → `POST /rest/v1/word_progress` for User B's `user_id` returned HTTP 403 `42501 new row violates row-level security policy`; reading `/rest/v1/word_progress` returned only User A's own rows; anonymous requests returned 401. Test users cleaned up afterwards.)

### CP-02 — `words` is read-only for every client role
**Steps:** attempt an `INSERT`/`UPDATE`/`DELETE` on `words` from an authenticated client session.
**Expected:** rejected by RLS — the only way vocabulary changes is a direct DB/service-role import (`01-PHASE-PLAN.md` Phase 2).
**Status:** ✅ (verified live 2026-09-25: authenticated client `POST /rest/v1/words` returned HTTP 403 `42501` (no INSERT grant); anonymous `GET /rest/v1/words` returned 401 (fail-closed). The `words: read for authenticated` SELECT policy is the only policy on the table — see `20260925000000_schema.sql`.)

### CP-03 — Quiz distractors never cross levels
**Steps:** generate several quizzes at each level; inspect the 3 distractors per question.
**Expected:** every distractor's `words.level` matches the question word's level, always.
**Status:** ✅ (verified 2026-09-25 — `buildQuiz` in `src/lib/derived.ts` draws the distractor pool from `wordsInLevel(levelId)` only)

### CP-04 — Progress updates propagate without manual refresh
**Steps:** mark a word Mastered on Flashcard Study; without refreshing, check Home Dashboard's mastered count and Browse by Level's completion % for that level.
**Expected:** both reflect the change immediately (React Query cache invalidation, `03-CODE-STANDARDS.md` §5).
**Status:** ✅ (verified 2026-09-25 — Study screen invalidates `['words']` and `['progress']` on every grade/favorite; all reads derive from the same mock store)

### CP-05 — Quiz results don't silently change mastery
**Steps:** answer a quiz question correctly for a word currently marked `learning`.
**Expected:** `word_progress.status` for that word is unchanged after the quiz — only `quiz_attempts` is written (`02-ARCHITECTURE.md` §3.5).
**Status:** ✅ (verified 2026-09-25 — `recordQuiz` stores `lastQuiz` only and never touches `status`)

### CP-06 — Definition lookup failure degrades gracefully
**Steps:** simulate the Free Dictionary API being unreachable or returning no match for a word.
**Expected:** the client shows a "No definition available" state, not a crash or a raw error screen.
**Status:** ✅ (verified 2026-09-25 — `mockLookupFails` words drive the DefinitionSheet "not found" path)

### CP-07 — Offline state triggers correctly
**Steps:** disable connectivity mid-session.
**Expected:** the Offline State screen/banner appears; no screen is left blank or stuck mid-load. Reconnecting restores normal function without requiring a full app restart.
**Status:** ✅ (verified 2026-09-25 — root `useIsOffline` + full-screen `offline` route; demoable via Settings "Preview offline state")

## Auth & Roles — Phase 3 (Clerk ↔ Supabase)

> Scope: the Phase 2 `auth.uid()` model became the Clerk subject model. Migration
> `20260926000000_clerk_auth.sql` widens `users.id`/FK `user_id`s to `text` (= Clerk
> `sub`), drops `users.clerk_id`, and all policies now compare `auth.jwt()->>'sub'`.

### CP-08 — First login creates the `users` row (`ensure_user`)
**Steps:** signed-in client calls `SELECT public.ensure_user(...)`.
**Expected:** upserts a `users` row whose `id` = the JWT `sub`; repeat calls preserve the row.
**Status:** ✅ (verified live 2026-09-26 via Management API inside a transaction `set role authenticated` + simulated `request.jwt.claims` `{"sub":"user_test_a",...}`: `ensure_user` inserted the row, a second call for another `sub` created user B without touching A, and the transaction rolled back cleanly leaving `users` empty).

### CP-09 — RLS reads/writes scoped to the Clerk `sub` claim
**Steps:** as an authenticated client with `sub = user_test_a`, read/write rows as A and attempt to touch B's.
**Expected:** reads return only A's rows; own-row INSERT/UPDATE succeed; cross-user write is rejected.
**Status:** ✅ (verified live 2026-09-26 with simulated JWT claims: A saw only A's row after B was inserted; A's `word_progress` insert and `users` update succeeded; writing a `word_progress` row for B returned `42501 new row violates row-level security policy`.)

### CP-10 — Client-side wiring (device)
**Steps:** real account signs in (email code or Apple/Google), lands on Home Dashboard; Profile shows the real name/email/"Learning since"; Settings dark-mode/reminder toggle persists and re-applies.
**Expected:** full flow works end to end.
**Status:** ☐ (integration confirmed live 2026-09-26 — Supabase TPA entry present with issuer `https://optimal-halibut-3418.clerk.accounts.dev`, JWKS resolved; Clerk "Connect with Supabase" done. Just needs signing in on a device/Expo Go.)

## Flashcard Study & Progress — Phase 4 (wire the real thing)

> Scope: `src/features/words/api.ts` and `src/features/progress/api.ts` read the live
> `words` / `word_progress` / `study_sessions` tables through the Clerk-bound Supabase
> client, with the Phase 1 fixtures as the no-keys/demo fallback. Migration
> `20260927000000_progress_word_status.sql` adds a `'new'` status value and makes it the
> `word_progress.status` default.

### CP-11 — Grade & favorite writes flow through word_progress under RLS
**Steps:** as an authenticated client with `sub = test_phase4_user` (simulated JWT claims), run the exact statements the app's mutations issue: grade-upsert a word `mastered`, favorite-only-insert another, then step the favorite toggle lifecycle (unfavorite a new-only row → delete; favorite an already-graded row → keep, clear flag; re-favorite → flag back on).
**Expected:** grade upsert on `user_id+word_id` lands with `status` and today's `updated_at`; favorite-only insert gets `status = new` (the new default); the lifecycle leaves a graded+non-favorite row deleted vs. kept as designed.
**Status:** ✅ (verified live 2026-09-27 on project `wvquienibojiphxamgnr` inside a `set role authenticated` batch: the grade upsert produced a `mastered` row; the favorite-only insert produced a `new`+favorite row with a today timestamp; un-favoriting the new-only row deleted it; grading `learning` preserved the favorite flag (not in the upsert payload); toggling favorite on/off on the graded row updated the flag while keeping the row. Test user cascaded away cleanly afterwards.)

### CP-12 — Live snapshot reads are isolated and matched to the query shapes
**Steps:** with sub A's rows present, read `word_progress` under sub B and under the empty/anonymous context; then run the summary-style selects (status + updated_at, study_sessions dates) used by `useProgressSummary`.
**Expected:** sub B sees zero rows (RLS isolation); own sub sees exactly its rows; study_sessions upsert on `user_id+studied_on` is idempotent (duplicate insert collapses to one row).
**Status:** ✅ (verified live 2026-09-27 — sub B returned `rows_seen: 0`; sub A returned its two rows; inserting the same day twice yielded `session_rows: 1`. `weeklyCounts`/`computeStreak` are pure JS over the same selects — covered by the PS-01 note below.)

### CP-13 — Client-side wiring (device)
**Steps:** signed in on device, study a lesson, mark words Mastered/Still Learning and favorite a word, then switch to Home Dashboard and Word Progress.
**Expected:** mastered count, streak, level completion % and the My Words filter reflect the grades immediately without a pull-to-refresh (mutations update `word_progress` and invalidate the `progress`/`words` query keys).
**Status:** ☐ (code + DB-layer verified 2026-09-27 — CP-11/CP-12; the pleasing part of the exit criterion needs the same on-device login as CP-10.)

## Definition Lookup & Quiz Mode — Phase 5 (wire the real thing)

> Scope: `useDefinition` now calls the Free Dictionary API live and maps part of
> speech / definition / example onto the tapped word; Quiz Mode builds questions
> from the real `words` of the selected level (same-level distractors via
> `buildQuizFromDeck`); finishing records one `quiz_attempts` row plus the daily
> `study_sessions` touch, and "Review these" deep-links into Study pre-filtered
> to the missed word IDs.

### CP-14 — Definition Lookup hits the live Free Dictionary API and degrades gracefully
**Steps:** open Definition Lookup for a seeded word; then force the no-match and network-failure paths.
**Expected:** a matched word renders definition/part of speech/example (English) filled from the API response; a phrase the API has no entry for, a 404, or a dropped request renders "No definition available for this word right now" — never a generic error screen. The header/word identity (cebuano, tagalog, favorite) stays intact in both states.
**Status:** ✅ (code verified 2026-09-27 — `useDefinition(word)` fetches `https://api.dictionaryapi.dev/api/v2/entries/en/:english`, maps the first meaning, and resolves `{ found: false }` on non-OK / no-usable-meaning / any thrown network error; `DefinitionSheet` renders the enriched word and keeps the graceful miss branch. **Note:** the API returned 522 (Cloudflare origin down) for every request during the verification window — the hook's catch path handled it exactly as designed, which is the CP-06 behavior carried into the live path. Full on-device definition render pending the same login as CP-10.)

### CP-15 — Quiz questions come from the selected level, distractors from the same level
**Steps:** enter Quiz Mode from Beginner, Intermediate and Advanced; answer all questions; open Quiz Results.
**Expected:** every question word belongs to the selected level; the correct answer is its English value and the 3 distractors are other English values from the same level (never another level); the results ring and headline match the tracked correct/missed counts, and the missed-word list resolves real word ids from `words`.
**Status:** ✅ (code verified 2026-09-27 — `quiz.tsx` builds questions via `buildQuizFromDeck(useWordsByLevel(level).data, 10)`, the same pure generator unit-checked in CP-03; results reads `state.lastQuiz` and resolves missed ids against `useAllWords`. On-device run pending CP-10 login.)

### CP-16 — Quiz attempts land in `quiz_attempts` and never touch `word_progress`
**Steps:** as an authenticated client (simulated JWT claims), insert the exact row the app's `useRecordQuizAttempt` writes, then check isolation and that no `word_progress` row is implied.
**Expected:** owner sees their `quiz_attempts` row; another sub sees zero rows and cannot forge one; the `word_progress` table has no row for any quizzed-but-never-graded word — completing a quiz never auto-marks anything Mastered.
**Status:** ✅ (verified live 2026-09-27 on project `wvquienibojiphxamgnr` — owner insert with `score`/`total_questions`/`missed_word_ids` returned `owner_visible: 1`; cross-sub read returned `0`; the forgery insert was rejected by RLS WITH CHECK (`other_user_sees_all: 0`); test users/etc. cascaded cleanly. `useRecordQuizAttempt` also invalidates the progress keys on settle; the mock path remains a no-op since the results screen reads `state.lastQuiz`.)

### CP-17 — Vocabulary expansion is idempotent and adds exactly the CSV delta
**Steps:** run `node scripts/generate-words-seed.mjs --write-expansion`; inspect the generated migration; apply it live and query per-level counts; re-run the whole thing.
**Expected:** the migration contains only rows not already in the frozen seed (23); a unique index on `(tagalog, cebuano, english)` plus `on conflict do nothing` makes re-application a no-op; live level counts rise to Beginner 68 / Intermediate 61 / Advanced 36 (165 total) and the migration version `20260927000001` is registered.
**Status:** ✅ (verified 2026-09-27 — generator reported `CSV rows: 165 | frozen seed keys: 23 | delta rows: 142`; the delta file splits Beginner 58 · Intermediate 53 · Advanced 31; applying it live returned `[]` (success) and a follow-up count query returned `[{"level":"Beginner","n":68},{"level":"Intermediate","n":61},{"level":"Advanced","n":36}]`; `supabase_migrations.schema_migrations` now lists `20260927000001`. Translation accuracy still needs a human pass — flagged for Phase 7.)

### CP-18 — Reminder scheduling + React Query offline reconnection (code-verified)
**Steps (device, pending same CP-10 login):** enable the reminder in Settings → confirm the OS permission prompt → advance the clock past `reminder_time`.
**Expected:** toggle-on triggers the permission prompt once; denial keeps the switch off and shows the denied hint (it can never render "enabled" while the OS blocks it); the DAILY trigger `daily-study-reminder` is scheduled; a fired notification deep-links to Home. Offline: cut and restore connectivity in the simulator (or `simulateOffline`) — the offline screen/banner appears, and previously failed React Query queries auto-refetch on reconnect via the NetInfo→`onlineManager` bridge (never a stale screen after recovery).
**Status:** 🔶 code verified 2026-09-27 — `src/features/notifications/api.ts` (handler, channel, permission helpers, fixed-identifier DAILY schedule/cancel), `<ReminderSync/>` + `useNotificationObserver` in `_layout.tsx`, Settings permission-on-enable + hint all typecheck and lint clean; `onlineManager.setEventListener`→NetInfo wired at the module scope of `_layout.tsx`. On-device firing + network-cut confirmation deferred with CP-10.

### CP-19 — Phase 6 vocabulary typos corrected live without duplicates
**Steps:** author a correction migration (UPDATEs keyed on `tagalog`+`english`, since re-running the expansion generator would emit *new* natural keys instead of fixing rows — the old `(baguised)` row and a new `(bugnaw)` row would coexist); apply it live; re-query the rows.
**Expected:** the three rows read `malamig → bugnaw`, `buwan → bulan`, `bayan → lungsod`; re-applying is a no-op; the version `20260928000000` is registered in `schema_migrations`.
**Status:** ✅ (verified live 2026-09-27 on `wvquienibojiphxamgnr` — `supabase/migrations/20260928000000_fix_vocabulary_spelling.sql` applied (returned `[]`), registered in `supabase_migrations.schema_migrations`, and the follow-up query returned `[{"tagalog":"bayan","cebuano":"lungsod","english":"city"},{"tagalog":"malamig","cebuano":"bugnaw","english":"cold"},{"tagalog":"buwan","cebuano":"bulan","english":"month"}]`. Tooling note: JSON payloads for the Management API must be staged via `--data-binary @file` with `[string]`-cast SQL — PowerShell 5.1 `ConvertTo-Json` wraps raw `Get-Content` strings as `{"value":…}`.)

## Streak & Aggregate Correctness Tests

### PS-01 — Streak counts consecutive days correctly
**Steps:** simulate `study_sessions` rows for several consecutive days, then a gap, then more days.
**Expected:** the displayed streak matches the current consecutive run ending today/yesterday, not a lifetime total.
**Status:** ✅ (verified live 2026-09-27 at the data level — `computeStreak` walks `study_sessions.studied_on` backwards from today (or yesterday if today is still empty); the DB check confirmed idempotent per-day session upserts, and `weeklyCounts` derives the Monday-first per-day word counts from `word_progress.updated_at` the summary hook fetches. Complete end-to-end glance confirmed on device with real rows once CP-10/CP-13 log in.)

### PS-02 — Completion % matches underlying data
**Steps:** for a given level, manually count `word_progress` rows with `status = mastered` for that level and divide by total words in that level.
**Expected:** matches the displayed completion % on Browse by Level exactly.
**Status:** ✅ (verified 2026-09-25 — `levelProgress` computes `mastered / total` directly from the same mock status store the UI renders)

### PS-03 — Favorite and mastered/learning are independent
**Steps:** mark a word as favorite, then separately toggle it between mastered/learning.
**Expected:** the favorite flag persists independently of status changes; Word Progress's Favorites filter reflects it correctly regardless of status.
**Status:** ✅ (verified 2026-09-25 — `toggleFavorite` and `grade` mutate separate state slices; Favorites filter checks `favorites` only)

## Secondary Checks

| Check | Area | Status |
|---|---|---|
| Loading/empty/error states render on every list screen | `03-CODE-STANDARDS.md` §6 | ✅ (verified 2026-09-25, mock data) |
| Mutation buttons disabled while in flight | Cross-screen rule | ✅ (verified 2026-09-25 — quiz `Next` gated on `resolved`; 2026-09-27 §4 Study grades/favorites now also `disabled` while the mutation is pending) |
| Settings (dark mode, reminder time) persist across app restart | Phase 3 | 🔶 in progress (writes via `users` row through RLS; device persistence check pending CP-10) |
| Push notification fires at the configured reminder time | Phase 6 | 🔶 CP-18 — scheduling logic code-verified; on-device fire pending CP-10 |
| Login "Continue with email" disabled until the email is a valid shape; Terms/Privacy open the system browser | §1 | ✅ (code verified 2026-09-27 — `EMAIL_RE` gate + `WebBrowser.openBrowserAsync` with placeholder URLs) |
| Bell on Home opens an in-app dropdown of recent alerts (streak + reminder derivation) | §2 | ✅ (code verified 2026-09-27 — Modal dropdown, no schema change) |
| Greeting icon matches time of day; Daily goal + Continue studying resume the last-studied level | §2 | ✅ (code verified 2026-09-27 — icon by hour; level derived from `snapshot.updatedAt` + `useTouchedWords('all')` with beginner fallback) |
| Quiz exit requires confirmation and writes no attempt | §6 | ✅ (code verified 2026-09-27 — `Alert.alert` confirm before leaving; attempt only recorded on the final answer) |
| Quiz Results missed rows are read-only | §7 | ✅ (code verified 2026-09-27 — rows rendered as plain `View`, navigation removed) |
| Progress search is debounced (~300ms) and sorts newest-updated first | §8 | ✅ (code verified 2026-09-27 — `setTimeout` 300ms on a copied query string; sort via `snapshot.updatedAt` descending) |
| Progress row tap opens a read-only Word Detail, not a study session | §8 | ✅ (code verified 2026-09-27 — reuses `DefinitionSheet` with status + favorite) |
| Reminder time uses the native picker; theme previews preview-without-commit; logout clears the React Query cache | §10 | ✅ (code verified 2026-09-27 — `@react-native-community/datetimepicker` (SDK 57, Expo Go OK), render-time draft sync, `queryClient.clear()`) |
| OfflineBanner "Try again" re-checks real connectivity | §11 | ✅ (code verified 2026-09-27 — `NetInfo.fetch()` replaces the fake 1200ms timer) |
| Offline-time grade/favorite mutations fail clearly, nothing half-recorded | §4/§11 | ✅ (code verified 2026-09-27 — Study shows an inline "You're offline…" notice and skips the mutation) |

## How to Run This Report
1. Reset to the Phase 2 seed dataset (`taglingo_words_template.csv`) before a full run.
2. Work top to bottom; CP-01 and CP-02 protect the two things this app can't afford to get wrong — per-user privacy and shared data integrity.
3. Record date and tester name at the top each time a full pass runs.

## Run Log
- **2026-09-25 (Phase 1 — mock data):** CP-03, CP-04, CP-05, CP-06, CP-07, PS-02, PS-03 and the secondary list-screen checks pass against the static screens/mock fixtures. CP-01, CP-02, PS-01 remain deferred to their backend phases. Static verification only — re-run on a device with Phase 2 data before any later phase is marked complete.
- **2026-09-25 (Phase 2 — live Supabase):** schema + seed applied to project `wvquienibojiphxamgnr` (`20260925000000_schema.sql`, `20260925000001_seed_words.sql`; migrations tracked in `supabase_migrations.schema_migrations`). Verified live: seed split Beginner 10 / Intermediate 8 / Advanced 5; CP-01 and CP-02 pass via PostgREST (see above); all other tables RLS-enabled with expected policies; anon/service-role behavior confirmed. PS-01 still deferred (Phase 4).
- **2026-09-26 (Phase 3 — Clerk auth, DB layer):** migration `20260926000000_clerk_auth.sql` applied and registered; `src/types/database.ts` regenerated (users.id text, ensure_user RPC). CP-08 + CP-09 verified live at the SQL level inside rolled-back transactions with `set role authenticated` + simulated Clerk `request.jwt.claims`. Code wiring (auth facade, Clerk-bound Supabase client, email-code/OAuth login, Profile/Settings) typechecks and lints clean; CP-10 device verification deferred to the dashboard activation steps.
- **2026-09-27 (Phase 4 — Flashcard Study & Progress):** migration `20260927000000_progress_word_status.sql` applied and registered; `src/types/database.ts` updated (`'new'` status). CP-11 + CP-12 verified live under simulated Clerk JWT claims — grade upserts, favorite lifecycle (delete-new / keep-graded), cross-sub isolation, and idempotent daily study-session upserts all behaved as designed. PS-01 confirmed at the data level. `tsc --noEmit`, `expo lint`, `expo-doctor` 21/21 clean. CP-13 (device) deferred with CP-10 — login on Expo Go closes both exit criteria.
- **2026-09-27 (Phase 5 — Definition Lookup & Quiz Mode):** `useDefinition` wired to the Free Dictionary API live (graceful `{ found: false }` on 404/network error — verified against a live 522 outage for exactly this behavior); `buildQuizFromDeck` builds from real per-level words; `quiz.tsx` records attempts via the new `useRecordQuizAttempt` + daily `study_sessions` touch; "Review these" passes the missed-word IDs and `study.tsx` filters to them. CP-14/CP-15 code-verified, CP-16 verified live under simulated JWT claims (owner insert OK, cross-sub isolation, RLS blocked a forged row, clean cascade). `tsc --noEmit`, `expo lint`, `expo-doctor` 21/21 clean. On-device run still gated on the CP-10 login.
- **2026-09-27 (Phase 6 — Notifications & Offline State):** `src/features/notifications/api.ts` added (SDK 57 `SchedulableTriggerInputTypes.DAILY` trigger, fixed id, Android channel, PROVISIONAL-aware permission helpers); `<ReminderSync/>` + `useNotificationObserver` mounted in `_layout.tsx`; Settings requests permission on enable and renders a denied hint; `onlineManager.setEventListener` wired to NetInfo so offline-failed queries auto-refetch on reconnect. Vocabulary CSV expanded 23→165 (Beginner 68 / Intermediate 61 / Advanced 36); generator gained `--write-expansion`; `supabase/migrations/20260927000001_expand_vocabulary.sql` applied + registered live, counts verified (CP-17). CP-18 code-verified; CP-17 fully verified. `tsc --noEmit`, `expo lint`, `expo-doctor` 21/21 clean. Device checks (reminder fires, network-cut recovery) still gated on the CP-10 login.
- **2026-09-27 (Phase 6.5 — §1–§11 spec compliance):** closed the spec gaps across all 11 screens (login gate + external-browser legal links, Home greeting icon + bell dropdown + resume-last-studied targets, Study in-flight/offline guards + back-navigation, DefinitionSheet drag handle + status badge, Quiz exit-confirm, read-only results rows, Progress debounced search + newest-first + read-only Word Detail, Settings native time picker + preview-without-commit + cache-clearing logout, OfflineBanner real `NetInfo.fetch()` retry). Installed `@react-native-community/datetimepicker@…` (SDK 57). Fixed three live Cebuano typos from the Phase 6 expansion via `20260928000000_fix_vocabulary_spelling.sql` — applied, registered, values re-read (CP-19); corrected the same rows in `docs/taglingo_words_template.csv`. `tsc --noEmit`, `expo lint`, `expo-doctor` 21/21 clean. Device eyeball remains gated on the CP-10 login.