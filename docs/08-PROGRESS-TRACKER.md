# TagLingo — Progress Tracker

Living status doc. Update this after every work session — it should always reflect reality. Status values: **Not started** · **In progress** · **Blocked** · **Done**.

---

## Phase Status

| Phase | Exit Criterion (from `01-PHASE-PLAN.md`) | Status | Notes |
|---|---|---|---|
| 0 — Environment & Installation | Empty app runs, connects to Supabase, connects to Clerk | In progress | Scaffold, deps, env wiring done (commit `fbed274`); lint/typecheck/expo-doctor 21/21/Android export all clean. Blocked on: user creates Supabase + Clerk projects and pastes real keys into `.env`; then verify live connections via Expo Go. |
| 1 — All UI Screens (static) | Reviewer can tap through every screen using only mock data | Done | All 11 screens + offline state built and navigable via mock data (18 words across 3 levels, seeded progress). Verified `expo lint`, `tsc --noEmit`, `expo-doctor` 21/21 clean. Mock-applicable critical-path tests pass (see below). |
| 2 — Data Layer, Schema & Word Seeding | `words` table live and seeded from CSV, RLS verified | Done | Migrations authored (`supabase/migrations/20260925000000_schema.sql` + `20260925000001_seed_words.sql`), applied to live project `wvquienibojiphxamgnr` via the Supabase Management API, and recorded in `supabase_migrations.schema_migrations` so `npx supabase db push` won't re-apply. Verified live: seed split Beginner 10 / Intermediate 8 / Advanced 5; all 5 tables RLS-enabled; CP-01 + CP-02 pass end-to-end via PostgREST (throwaway auth user, cleaned up); anon is fail-closed. `src/types/database.ts` regenerated to match. Lint/typecheck/expo-doctor clean. |
| 3 — Auth & Roles | Real account logs in, lands on Home Dashboard, Profile reflects real data | In progress | Code + DB live: migration `20260926000000_clerk_auth.sql` applied (users.id → text = Clerk `sub`, RLS via `auth.jwt()->>'sub'`, `ensure_user` RPC) and registered in `supabase_migrations.schema_migrations`; `src/types/database.ts` regenerated. New `src/lib/auth.tsx` + Clerk-bound `src/lib/supabase.ts` + `src/features/user/api.ts`; real Clerk login (`useSSO`, email-code); Profile/Settings wired; lint / tsc / expo-doctor clean. **Integration verified live:** Clerk↔Supabase Third Party Auth entry present via Management API (issuer `https://optimal-halibut-3418.clerk.accounts.dev`, type `clerk-development`, JWKS resolved); Clerk "Connect with Supabase" done. Only the final on-device login remains. |
| 4 — Flashcard Study & Progress | Mastered word reflects instantly across Home/Browse/Progress | In progress | Code + DB done: migration `20260927000000_progress_word_status.sql` applied live (`'new'` enum value + `status` default) and registered in `supabase_migrations.schema_migrations`; `src/features/words/api.ts` + `src/features/progress/api.ts` read `words`/`word_progress`/`study_sessions` through the Clerk-bound client with a mock fallback; mutations (grade / favorite lifecycle / daily study session) upsert via RLS (simulated JWT claims verified live — CP-11/CP-12) and invalidate the progress/words keys. Study/Home/Browse/Progress/Profile rewired off the mock store; weekly history relabelled words, not minutes. Lint / tsc / expo-doctor clean. Remaining: on-device login (same as Phase 3) to see real rows and close the exit criterion. |
| 5 — Definition Lookup & Quiz Mode | Full quiz runs end to end, missed word reviewable from results | In progress | Code + DB done: `useDefinition` calls the Free Dictionary API live (graceful `{ found: false }` on 404/network failure — holds even while the API itself was returning 522 during verification); `buildQuizFromDeck` builds up to 10 questions from real per-level words with same-level distractors; `quiz.tsx` records an attempt via new `src/features/quiz/api.ts` `useRecordQuizAttempt` plus the daily `study_sessions` touch; "Review these" passes the missed-word IDs and Study filters to them. `quiz_attempts` insert verified live under simulated JWT claims (CP-16). Lint / tsc / expo-doctor clean. Remaining: on-device run (same login blocker as Phases 3/4) to confirm the full quiz + definition flow end to end. |
| 6 — Notifications & Offline State | Reminder fires; offline state shows correctly | Not started | |
| 7 — Polish, Test, Submit | Installable APK, demo runs start to finish, word count target met | Not started | |

## Critical-Path Test Status (mirrors `05-TESTING-REPORT.md`)

| Test | Status |
|---|---|
| CP-01 | ✅ verified live on Supabase (postgREST, auth user) — cross-user `word_progress` write → 403, read → own rows only |
| CP-02 | ✅ verified live on Supabase — authenticated `POST /words` → 403; anonymous → 401 |
| CP-03 | ✅ verified against mock quiz generator (distractors always same-level) |
| CP-04 | ✅ verified against mock state + React Query invalidation on grade/favorite |
| CP-05 | ✅ verified — `recordQuiz` writes `lastQuiz` only (plus the `quiz_attempts` row from Phase 5, CP-16), never touches `status` |
| CP-06 | ✅ verified — DefinitionSheet renders "No definition available" on `{found:false}`; Phase 5's live `useDefinition` maps the Free Dictionary API onto the same graceful branch |
| CP-07 | ✅ verified — root connectivity hook + full-screen Offline state + demo switch |
| CP-14 | ✅ verified (Phase 5) — definition lookup fetches the live API, renders part of speech/definition/example, and degrades to the graceful miss on 404/network failure |
| CP-15 | ✅ verified (Phase 5) — quiz questions + same-level distractors built from real per-level words; results ring/missed list resolve real word ids |
| CP-16 | ✅ verified live (Phase 5) — one `quiz_attempts` row per completion, isolated per user, RLS blocks forging, never auto-grades `word_progress` |
| PS-01 | ✅ verified (Phase 4) — streak computed from `study_sessions` (consecutive days ending today/yesterday), weekly counts from `word_progress.updated_at` |
| PS-02 | ✅ verified — completion % computed directly from `state.status` |
| PS-03 | ✅ verified — favorites tracked independently of status |

## Vocabulary Seeding Progress
Track expansion from the CSV template (23 starter words) toward the 200–300 word target (`01-PHASE-PLAN.md` Phase 6).

| Level | Current Count | Target |
|---|---|---|
| Beginner | 10 | ~70-100 |
| Intermediate | 8 | ~70-100 |
| Advanced | 5 | ~60-100 |

## Known Blockers
- **No local Supabase verification path** — Docker is not installed on this machine, so `supabase start`/`db lint`/locally-restarting PostgREST can't run. Phase 2/3 migrations were applied and verified live via the Supabase Management API instead. DB-level `npx supabase link` + `supabase db push` can't run without the Postgres password; prefer the Management API (`POST /v1/projects/<ref>/database/query`) for any future DDL.
- **Clerk↔Supabase Third Party Auth** is now active — confirmed live via Management API `GET /config/auth/third-party-auth` (issuer `https://optimal-halibut-3418.clerk.accounts.dev`, type `clerk-development`, JWKS resolved). The Clerk instance is a **development** instance: correct for Expo Go testing, but the production Clerk instance needs its own Connect + TPA entry before release.
- **Security: rotate the Supabase access token** — an earlier `.env.example` contained the real token (`sbp_df8a…`); it was redacted before commit but remains in local git history. Rotate it in Supabase → Account → Access Tokens and update `.env`.

## Open Decisions
- [ ] Daily goal word count on Home Dashboard — hardcoded at 20 for v1; revisit if it should be user-configurable.
- [ ] Word Progress row tap: navigate into single-word study, or open a read-only detail view? (`07-FUNCTIONALITY-PROMPT.md` §8)
- [ ] Whether audio pronunciation (mentioned in `00-PROJECT-OVERVIEW.md` §1 but not built in v1) gets added before submission.

---

**Last updated:** 2026-09-27 (Phase 5 code + DB done — `useDefinition` calls the Free Dictionary API live with a graceful `{ found: false }` miss; `buildQuizFromDeck` generates same-level-distractor quizzes from real per-level words; `quiz.tsx`/`quiz-results.tsx`/`study.tsx` wired for real-word quizzes, `quiz_attempts` recording, and the missed-word "Review these" deep-link; `quiz_attempts` insert verified live under simulated Clerk JWT claims. Remaining, shared with Phases 3/4: on-device sign-in on Expo Go to close the exit criterion.)