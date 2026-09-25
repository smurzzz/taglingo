# TagLingo — Functionality Prompt (All Screens)

This is a build prompt for implementing **functionality**, not visuals — pair it with the mockups for layout, and `02-ARCHITECTURE.md` for the data model. Hand this to an AI coding agent or use it as your own implementation checklist, one screen at a time.

---

## 1. Welcome / Login
**Purpose:** authenticate, route to Home Dashboard.

- On tap "Continue with email/Apple/Google": trigger Clerk's auth flow.
- On success: check if a `users` row exists for this account.
  - If not, create one (first login), with default `dark_mode = false`, `reminder_enabled = true`.
  - Route to Home Dashboard.
- On failure/cancel: stay on screen, show a non-blocking error.
- Persist session; skip this screen on relaunch if a valid session exists.

---

## 2. Home Dashboard
**Purpose:** at-a-glance progress and quick resume.

- On load: fetch current streak (`study_sessions`, `02-ARCHITECTURE.md` §3.4) and mastered word count (`word_progress` where `status = mastered`) for the current user.
- "Continue studying": navigate to Flashcard Study Mode, resuming the last-studied level if known, otherwise Beginner.
- Daily goal progress bar: words studied today (distinct `word_progress` rows touched today) vs. a fixed daily goal (e.g. 20 words — configurable later, hardcoded for v1).
- Pull-to-refresh re-fetches all dashboard data.

---

## 3. Browse by Level
**Purpose:** entry point into study, organized by difficulty.

- On load: for each level (Beginner/Intermediate/Advanced), fetch total word count and completion % for the current user (`02-ARCHITECTURE.md` §5).
- Tapping a level card: navigate to a level-scoped view offering both **Study** (Flashcard Study Mode) and **Quiz** entry points.
- Optional search bar: filters words across all levels by Tagalog/Cebuano/English spelling (client or server-side, debounced ~300ms).

---

## 4. Flashcard Study Mode
**Purpose:** the core learning loop.

- On load: fetch words for the selected level, ordered so `learning`-status words surface before already-`mastered` ones (encourages reviewing weak words first).
- Tap to flip: reveal the English translation (and Cebuano/Tagalog counterpart per the card design).
- Tap the English translation: open Definition Lookup (§5) for that word.
- "Still Learning" / "Mastered": upsert `word_progress` for (user, word) with the chosen `status`; also upsert today's `study_sessions` row if not already present.
- Favorite icon: toggle `word_progress.is_favorite` independently of status (`02-ARCHITECTURE.md` §3.3).
- Disable both status buttons while the mutation is in flight.

---

## 5. Definition Lookup
**Purpose:** show a live English definition.

- On open: call `GET /api/definitions/:word` (`02-ARCHITECTURE.md` §7) with the word's `english` value.
- Loading state while the request is in flight.
- On success: render definition, part of speech, and example sentence in the bottom sheet.
- On `{ found: false }` or network failure: show "No definition available for this word right now" — not a generic error screen (`05-TESTING-REPORT.md` CP-06).
- Bookmark icon here mirrors the Flashcard Study favorite toggle for the same word (shared state, not a separate flag).

---

## 6. Quiz Question
**Purpose:** multiple-choice reinforcement.

- On entering Quiz Mode for a level: generate 10 questions per `02-ARCHITECTURE.md` §6 (random words from that level, 3 same-level distractors each).
- Progress indicator: "Question N of 10."
- On answer select: lock the choice, briefly show correct/incorrect, advance automatically after a short delay (or on tap "Next").
- Track score and any missed word IDs client-side through the quiz; don't write to `quiz_attempts` until the quiz is complete (§7).

---

## 7. Quiz Results
**Purpose:** show outcome, enable targeted review.

- On quiz completion: insert one `quiz_attempts` row with `score`, `total_questions = 10`, `missed_word_ids` (`02-ARCHITECTURE.md` §3.5). **Do not** modify `word_progress` here — quiz results are independent of mastery status (`05-TESTING-REPORT.md` CP-05).
- Display score, an encouraging message, and the list of missed words with their correct English meaning.
- "Review these": navigate to Flashcard Study Mode pre-filtered to just the missed word IDs.

---

## 8. Word Progress ("My Words")
**Purpose:** full word list, filterable by status.

- On load: fetch all words the current user has touched (i.e. has a `word_progress` row for), joined with `words` for display text.
- Filter chips: All / Mastered / Learning / Favorites — filter the fetched list client-side by `status`/`is_favorite`.
- Tapping a row: navigate into Flashcard Study Mode focused on that single word, or open a read-only detail view (pick one consistently).
- Search bar: filter the same list by Tagalog/Cebuano/English spelling.

---

## 9. Profile
**Purpose:** account summary.

- Display name/avatar, mastered word count, current streak.
- Weekly study history chart: aggregate `study_sessions` (or minutes if tracked) for the last 7 days.
- Settings gear icon: navigate to Settings (§10).

---

## 10. Settings
**Purpose:** preferences.

- **Daily reminder toggle + time picker**: writes `users.reminder_enabled` / `users.reminder_time`; reschedules the local push notification (`expo-notifications`) accordingly.
- **Dark mode toggle**: writes `users.dark_mode`; applies immediately across the app without requiring a restart.
- **Log out**: clear Clerk session, clear cached React Query data, navigate to Login.

---

## 11. Offline State
**Purpose:** handle connectivity loss gracefully, given the fully online architecture (`00-PROJECT-OVERVIEW.md` §4.2).

- Detect connectivity loss (e.g. via a network-status hook) at the app root, not per-screen.
- Show the full-screen or banner Offline State per the design (`00-PROJECT-OVERVIEW.md` mockups, screen 11): "You're offline — reconnect to keep studying," with a "Try again" action.
- Bottom navigation remains visible but visually muted/disabled while offline.
- On reconnect: dismiss automatically and resume normal function — no manual "retry" should be required for read queries that React Query will naturally refetch on reconnect.

---

## Cross-screen rules that apply everywhere
- Every list screen (Browse by Level, Word Progress) should handle three states explicitly: loading, empty, and error.
- Every mutation (mark mastered/learning, favorite, quiz submit, settings save) should disable its trigger while in flight.
- Every form should preserve entered data on a failed submit.
- Any change to `word_progress` or `quiz_attempts` must match a documented behavior in `02-ARCHITECTURE.md` §3 — if a screen seems to need something undocumented, update the architecture doc first.