# TagLingo — Progress Tracker

Living status doc. Update this after every work session — it should always reflect reality. Status values: **Not started** · **In progress** · **Blocked** · **Done**.

---

## Phase Status

| Phase | Exit Criterion (from `01-PHASE-PLAN.md`) | Status | Notes |
|---|---|---|---|
| 0 — Environment & Installation | Empty app runs, connects to Supabase, connects to Clerk | In progress | Scaffold, deps, env wiring done (commit `fbed274`); lint/typecheck/expo-doctor 21/21/Android export all clean. Blocked on: user creates Supabase + Clerk projects and pastes real keys into `.env`; then verify live connections via Expo Go. |
| 1 — All UI Screens (static) | Reviewer can tap through every screen using only mock data | Done | All 11 screens + offline state built and navigable via mock data (18 words across 3 levels, seeded progress). Verified `expo lint`, `tsc --noEmit`, `expo-doctor` 21/21 clean. Mock-applicable critical-path tests pass (see below). |
| 2 — Data Layer, Schema & Word Seeding | `words` table live and seeded from CSV, RLS verified | Not started | |
| 3 — Auth & Roles | Real account logs in, lands on Home Dashboard, Profile reflects real data | Not started | |
| 4 — Flashcard Study & Progress | Mastered word reflects instantly across Home/Browse/Progress | Not started | |
| 5 — Definition Lookup & Quiz Mode | Full quiz runs end to end, missed word reviewable from results | Not started | |
| 6 — Notifications & Offline State | Reminder fires; offline state shows correctly | Not started | |
| 7 — Polish, Test, Submit | Installable APK, demo runs start to finish, word count target met | Not started | |

## Critical-Path Test Status (mirrors `05-TESTING-REPORT.md`)

| Test | Status |
|---|---|
| CP-01 | ☐ (requires backend RLS — Phase 2+) |
| CP-02 | ☐ (requires backend RLS — Phase 2+) |
| CP-03 | ✅ verified against mock quiz generator (distractors always same-level) |
| CP-04 | ✅ verified against mock state + React Query invalidation on grade/favorite |
| CP-05 | ✅ verified — `recordQuiz` writes `lastQuiz` only, never touches `status` |
| CP-06 | ✅ verified — DefinitionSheet renders "No definition available" on `{found:false}` |
| CP-07 | ✅ verified — root connectivity hook + full-screen Offline state + demo switch |
| PS-01 | ☐ (requires `study_sessions` aggregation — Phase 4) |
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
- **Phase 0 → real backend connections.** Need a Supabase project (URL + anon key) and a Clerk project (publishable key), entered into `.env`. App compiles and runs with placeholders and shows setup cards until then. Owner: user.

## Open Decisions
- [ ] Daily goal word count on Home Dashboard — hardcoded at 20 for v1; revisit if it should be user-configurable.
- [ ] Word Progress row tap: navigate into single-word study, or open a read-only detail view? (`07-FUNCTIONALITY-PROMPT.md` §8)
- [ ] Whether audio pronunciation (mentioned in `00-PROJECT-OVERVIEW.md` §1 but not built in v1) gets added before submission.

---

**Last updated:** 2026-09-25 (Phase 1 done — all static screens, mock fixtures, shared components, mock-applicable tests verified)