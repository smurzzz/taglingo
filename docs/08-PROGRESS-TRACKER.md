# TagLingo — Progress Tracker

Living status doc. Update this after every work session — it should always reflect reality. Status values: **Not started** · **In progress** · **Blocked** · **Done**.

---

## Phase Status

| Phase | Exit Criterion (from `01-PHASE-PLAN.md`) | Status | Notes |
|---|---|---|---|
| 0 — Environment & Installation | Empty app runs, connects to Supabase, connects to Clerk | Not started | |
| 1 — All UI Screens (static) | Reviewer can tap through every screen using only mock data | Not started | |
| 2 — Data Layer, Schema & Word Seeding | `words` table live and seeded from CSV, RLS verified | Not started | |
| 3 — Auth & Roles | Real account logs in, lands on Home Dashboard, Profile reflects real data | Not started | |
| 4 — Flashcard Study & Progress | Mastered word reflects instantly across Home/Browse/Progress | Not started | |
| 5 — Definition Lookup & Quiz Mode | Full quiz runs end to end, missed word reviewable from results | Not started | |
| 6 — Notifications & Offline State | Reminder fires; offline state shows correctly | Not started | |
| 7 — Polish, Test, Submit | Installable APK, demo runs start to finish, word count target met | Not started | |

## Critical-Path Test Status (mirrors `05-TESTING-REPORT.md`)

| Test | Status |
|---|---|
| CP-01 | ☐ |
| CP-02 | ☐ |
| CP-03 | ☐ |
| CP-04 | ☐ |
| CP-05 | ☐ |
| CP-06 | ☐ |
| CP-07 | ☐ |
| PS-01 | ☐ |
| PS-02 | ☐ |
| PS-03 | ☐ |

## Vocabulary Seeding Progress
Track expansion from the CSV template (23 starter words) toward the 200–300 word target (`01-PHASE-PLAN.md` Phase 6).

| Level | Current Count | Target |
|---|---|---|
| Beginner | 10 | ~70-100 |
| Intermediate | 8 | ~70-100 |
| Advanced | 5 | ~60-100 |

## Known Blockers
_(none logged yet — add here as they come up, with the phase they're blocking)_

## Open Decisions
- [ ] Daily goal word count on Home Dashboard — hardcoded at 20 for v1; revisit if it should be user-configurable.
- [ ] Word Progress row tap: navigate into single-word study, or open a read-only detail view? (`07-FUNCTIONALITY-PROMPT.md` §8)
- [ ] Whether audio pronunciation (mentioned in `00-PROJECT-OVERVIEW.md` §1 but not built in v1) gets added before submission.

---

**Last updated:** [date] by [name]