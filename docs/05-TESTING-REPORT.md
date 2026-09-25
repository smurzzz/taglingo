# TagLingo — Testing Report

Status legend: ☐ not yet run · ✅ pass · ❌ fail (with note)

Re-run these before considering any phase in `01-PHASE-PLAN.md` that touches `words`, `word_progress`, or `quiz_attempts` complete.

## Critical Path Tests

### CP-01 — `word_progress` is scoped per user
**Steps:** authenticated as User A, attempt to read or write a `word_progress` row belonging to User B.
**Expected:** rejected by RLS in both directions.
**Status:** ☐ (requires live Supabase + RLS — Phase 2+)

### CP-02 — `words` is read-only for every client role
**Steps:** attempt an `INSERT`/`UPDATE`/`DELETE` on `words` from an authenticated client session.
**Expected:** rejected by RLS — the only way vocabulary changes is a direct DB/service-role import (`01-PHASE-PLAN.md` Phase 2).
**Status:** ☐ (requires live Supabase + RLS — Phase 2+)

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

## Streak & Aggregate Correctness Tests

### PS-01 — Streak counts consecutive days correctly
**Steps:** simulate `study_sessions` rows for several consecutive days, then a gap, then more days.
**Expected:** the displayed streak matches the current consecutive run ending today/yesterday, not a lifetime total.
**Status:** ☐ (requires `study_sessions` aggregation — Phase 4)

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
| Mutation buttons disabled while in flight | Cross-screen rule | ✅ (verified 2026-09-25 — quiz `Next` gated on `resolved`; Grade/favorite apply synchronously against mock store) |
| Settings (dark mode, reminder time) persist across app restart | Phase 3 | ☐ (Phase 3 — real backend persistence) |
| Push notification fires at the configured reminder time | Phase 6 | ☐ (Phase 6) |

## How to Run This Report
1. Reset to the Phase 2 seed dataset (`taglingo_words_template.csv`) before a full run.
2. Work top to bottom; CP-01 and CP-02 protect the two things this app can't afford to get wrong — per-user privacy and shared data integrity.
3. Record date and tester name at the top each time a full pass runs.

## Run Log
- **2026-09-25 (Phase 1 — mock data):** CP-03, CP-04, CP-05, CP-06, CP-07, PS-02, PS-03 and the secondary list-screen checks pass against the static screens/mock fixtures. CP-01, CP-02, PS-01 remain deferred to their backend phases. Static verification only — re-run on a device with Phase 2 data before any later phase is marked complete.