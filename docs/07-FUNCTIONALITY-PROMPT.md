# TagLingo — Functionality Prompt (All Screens)

This is a build prompt for implementing **functionality**, not visuals — pair it with the mockups for layout, and `02-ARCHITECTURE.md` for the data model. Every tappable element visible in the mockups is listed per screen below; nothing on screen should be a dead tap. Hand this to an AI coding agent or use it as your own implementation checklist, one screen at a time.

---

## 1. Welcome / Login
**Elements:** logo + tagline, email input, "Continue with email" button, divider, "Continue with Apple" button, "Continue with Google" button, Terms of Use / Privacy Policy links.

- Email field: standard email validation before enabling "Continue with email"; on submit, trigger Clerk's email/passwordless flow.
- "Continue with Apple" / "Continue with Google": trigger the respective Clerk OAuth flow.
- On success (any method): check if a `users` row exists for this account.
  - If not, create one (first login), with default `dark_mode = false`, `reminder_enabled = true`, `reminder_time = 19:30`.
  - Route to Home Dashboard.
- On failure/cancel: stay on screen, show a non-blocking inline error near the triggering button.
- "Terms of Use" / "Privacy Policy" links: open the respective static page (in-app webview or external browser — decide and document which).
- Persist session; skip this screen entirely on relaunch if a valid session exists.

---

## 2. Home Dashboard
**Elements:** greeting header, notification bell icon, streak card, mastered-words card, "Continue studying" button, level progress bar + %, "Daily goal" row (tappable, chevron), bottom nav, optional offline banner.

- Greeting: "Good morning/afternoon/evening, [first name]" based on device local time; sun/cloud/moon icon matches time of day.
- **Notification bell (top right):** opens a lightweight Notifications view (modal or screen) listing recent reminder and streak-milestone alerts (e.g. "You hit a 12-day streak!"). If a full notifications history isn't built for v1, this can open a simple dropdown of the last few alerts instead of a dedicated screen — decide and document which, in `08-PROGRESS-TRACKER.md`.
- **Streak card:** read-only display, current streak from `study_sessions` (`02-ARCHITECTURE.md` §3.4). Not tappable.
- **Mastered-words card:** read-only display, count from `word_progress` where `status = mastered`. Not tappable.
- **"Continue studying" button:** navigates to Flashcard Study Mode, resuming the last-studied level (or Beginner if none yet).
- **Level progress bar** ("You are X% through [Level]"): shows the *lowest-completion, not-yet-100%* level by default; tapping the row navigates to Browse by Level with that level pre-expanded.
- **"Daily goal" row** (e.g. "16 / 20 words", chevron): tapping navigates into Flashcard Study Mode continuing today's in-progress session; the fraction is distinct words interacted with today vs. the fixed daily goal (`02-ARCHITECTURE.md` §2, hardcoded at 20 for v1).
- **Offline banner** (compact, non-blocking — see §11b): appears above the greeting only while offline; "Try again" re-triggers a connectivity check without navigating away from Home.
- Pull-to-refresh re-fetches all dashboard data.
- Bottom nav (Home/Browse/Study/Progress/Profile): Home is the active tab here; each icon navigates to its respective root screen.

---

## 3. Browse by Level
**Elements:** back arrow, title, three level cards (icon, name, word count, progress bar, %, chevron), bottom nav.

- Back arrow: returns to the previous screen (typically Home).
- Each level card (Beginner / Intermediate / Advanced):
  - Displays total word count for that level (`words` filtered by `level`) and this user's completion % (`02-ARCHITECTURE.md` §5).
  - Tapping the card (or its chevron) navigates into that level's landing view, offering both **Study** and **Quiz** entry points for that level.
- Bottom nav: Browse is the active tab.

---

## 4. Flashcard Study
**Elements:** close (X) icon, position counter ("4/20"), bookmark icon, card (language label, word, tap-to-flip hint), "Still learning" button, "Mastered" button.

- **Close (X):** exits the study session, returns to Browse by Level (or wherever the session was entered from). Confirm-before-exit is not required — progress is saved per-card as it happens, not batched at session end.
- **Position counter** ("4/20"): read-only, reflects current card index within the level's word set (or the day's queued set, per §2's daily-goal logic).
- **Bookmark icon (top right):** toggles `word_progress.is_favorite` for the current word, independent of mastery status (`02-ARCHITECTURE.md` §3.3). Icon fills/highlights when active.
- **Card, front:** shows the word in one language (e.g. Tagalog) with a small language label.
- **Tap card / "Tap to flip":** flips to reveal the second-language word (e.g. Cebuano) — this is a pure UI flip, no network call.
- **Card, after flip:** the translated word becomes tappable itself — tapping it opens Definition Lookup (§5) for that word's English meaning.
- **"Still learning" button:** upserts `word_progress` with `status = 'learning'` for (user, word); upserts today's `study_sessions` row if not already present; advances to the next card.
- **"Mastered" button:** same, with `status = 'mastered'`; advances to the next card.
- Both status buttons disable while their mutation is in flight, to prevent double-taps on a fast swipe.
- On the final card of the set: navigate to a short completion state (or straight back to Browse by Level) rather than looping silently.

---

## 5. Definition Lookup
**Elements:** close (X) icon, position counter, bookmark icon (shared with §4), bottom sheet with drag handle, English translation, part of speech, definition, example sentence + its own translation.

- Opens as a bottom sheet over the current Flashcard Study card (not a full navigation — the card underneath stays visible/dimmed).
- **Drag handle:** swipe down (or tap outside the sheet) to dismiss, returning focus to the flashcard.
- **Close (X)** (top of the underlying card, still visible): also dismisses the sheet if tapped, same as swipe-down.
- **Bookmark icon:** same toggle as §4 — favoriting from here affects the same `word_progress.is_favorite` field, not a separate flag.
- On open: call `GET /api/definitions/:word` (`02-ARCHITECTURE.md` §7) using the word's `english` value.
- **Loading state:** brief skeleton/placeholder in the sheet while the request is in flight.
- **Success:** render English translation, part of speech, definition, and an example sentence with its English translation shown as a caption underneath.
- **No match / network failure:** replace the definition/example rows with "No definition available for this word right now" (`05-TESTING-REPORT.md` CP-06) — never a blank sheet or raw error.

---

## 6. Quiz Question
**Elements:** close (X) icon, "Question N of 10" header, progress dots/bar, prompt word, instruction subtext, four lettered answer options (A-D).

- **Close (X):** exits the quiz with a confirmation ("Your quiz progress will be lost — Exit anyway?") since, unlike flashcards, quiz state isn't saved until completion (§7). If the user confirms, no `quiz_attempts` row is written.
- **Progress dots/bar:** read-only, reflects current question index out of 10.
- **Answer options (A-D):** exactly one is correct (the word's `english` value); the other three are distractors from the same level (`02-ARCHITECTURE.md` §6). Tapping an option:
  - Locks all four options (disable further taps for this question).
  - Highlights the selected option and the correct option (green/red per the design system) briefly.
  - Auto-advances to the next question after a short delay, or on a "Next" tap if the design calls for an explicit confirm step — pick one and keep it consistent across all 10 questions.
- Track score and any missed word IDs in local component state through the quiz; nothing is written to the database until the quiz completes (§7).

---

## 7. Quiz Results
**Elements:** close (X) icon, score ring ("8/10"), encouragement message + subtitle, "You missed:" list, "Review these" button.

- On arriving at this screen (quiz just completed): insert one `quiz_attempts` row with `score`, `total_questions = 10`, `missed_word_ids` (`02-ARCHITECTURE.md` §3.5). **Do not** modify `word_progress` here (`05-TESTING-REPORT.md` CP-05).
- **Close (X):** returns to Browse by Level (or wherever the quiz was launched from).
- **Score ring:** read-only, animates in on load (nice-to-have, not required).
- **Encouragement message:** vary the copy based on score band (e.g. ≥80% vs. lower) — write 2-3 variants rather than one static line, so repeat quiz-takers see some variety.
- **"You missed:" list:** each row shows the missed word and its correct English meaning; rows are read-only (not individually tappable) — reviewing happens via the button below, not per-row, to keep this screen simple.
- **"Review these" button:** navigates to Flashcard Study Mode, pre-filtered to just the `missed_word_ids` from this attempt. If there were zero misses, hide this button and show a "Perfect score!" state instead.

---

## 8. Word Progress ("My Words")
**Elements:** header, search icon, filter chips (All/Mastered/Learning/Favorites), word list (each row: word, meaning, status badge, chevron), bottom nav.

- On load: fetch all words the current user has touched (has a `word_progress` row for), joined with `words` for display text, newest-updated first.
- **Search icon (top right):** expands/opens a search bar; filters the same list by Tagalog/Cebuano/English spelling as the user types (debounced ~300ms). Tapping the icon again (or a close affordance once expanded) collapses it back.
- **Filter chips** (All / Mastered / Learning / Favorites): single-select, filters the fetched list client-side by `status`/`is_favorite`. "All" is the default active state.
- **Each word row:** tapping opens a read-only Word Detail view — translations, definition (reuses the §5 lookup), current status, and the same favorite toggle as §4/§5. This is a lighter-weight detail view, not a full study session launch, so browsing here doesn't affect the "position counter" state used in Flashcard Study.
- **Status badge** on each row (Mastered/Learning/Favorite — a word can show more than one, e.g. Mastered + Favorite): read-only in the list view; changed only from the Word Detail view or Flashcard Study.
- Bottom nav: Progress is the active tab.

---

## 9. Profile
**Elements:** settings gear icon, avatar, name, mastered-words stat, streak stat, "This week's study history" bar chart, bottom nav.

- **Settings gear icon (top right):** navigates to Settings (§10).
- Avatar/name: read-only display from `users`/Clerk profile data. (Editing name/avatar is not in v1 scope — if added later, document the edit flow here.)
- **Stat cards** (mastered words, day streak): read-only, same source data as Home Dashboard §2 — must always agree with what Home shows, since both read the same underlying query.
- **Weekly study history bar chart:** one bar per day (M-S), height representing minutes studied (or words studied, if minutes aren't tracked — decide and document which metric is actually measured, since the mockup labels the axis "(mins)"). Bars are not individually tappable in v1.
- Bottom nav: Profile is the active tab.

---

## 10. Settings
**Elements:** back arrow, header, "Study reminders" section (toggle + time row), "Appearance" section (dark mode toggle + light/dark preview cards), "Log out" button.

- Back arrow: returns to Profile.
- **Daily reminder toggle:** writes `users.reminder_enabled`; immediately schedules/cancels the local push notification (`expo-notifications`) accordingly — no separate save step.
- **Daily reminder time row** (e.g. "7:30 PM", chevron): tapping opens a native time picker; on confirm, writes `users.reminder_time` and reschedules the notification. If the reminder toggle is off, this row should appear visually disabled but is still safe to tap (it just won't schedule anything until the toggle is re-enabled).
- **Dark mode toggle:** writes `users.dark_mode`; applies the theme change immediately app-wide, no restart required.
- **Light / Dark preview cards** ("Tap to preview light or dark theme"): tapping either card previews that theme without committing it — only the toggle above actually persists the setting. Make sure the preview and the toggle can't drift out of sync (e.g. previewing Dark then leaving the screen should revert to the toggle's actual saved state, not silently keep the preview).
- **"Log out" button:** clears the Clerk session, clears all cached React Query data, navigates to Login (§1).

---

## 11. Offline Handling
TagLingo is online-only for writes (`00-PROJECT-OVERVIEW.md` §4.2), but the mockups define **two distinct offline states** depending on whether the current screen already has cached data to show:

### 11a. Full-screen Offline State
**When it shows:** connectivity is unavailable and the current screen has no usable cached data to render (e.g. cold app launch with no prior session, or entering Flashcard/Quiz/Definition Lookup with nothing cached for that level).
**Elements:** wilted-plant illustration, "You're offline." headline, explanatory subtext, "Try again" button, lock icon + "Your saved words are safe on this device" reassurance line, muted bottom nav.

- **"Try again" button:** re-runs a connectivity check; on success, proceeds to the screen's normal load; on failure, stays on this screen with no jarring re-flash.
- **Bottom nav (muted/disabled):** visible for orientation but not interactive while this state is showing — tapping a tab does nothing (or, preferably, only navigates to tabs whose data is already cached; decide and document which behavior ships).
- The reassurance line refers to locally cached `word_progress`/`words` data from the last successful sync — nothing new can be written while offline, but nothing already-synced is lost either.

### 11b. Compact Offline Banner
**When it shows:** connectivity drops while viewing a screen that already has cached/rendered data (e.g. Home Dashboard, as in the mockup) — the screen keeps showing its last-known data rather than blocking it.
**Elements:** leaf icon, "You're offline — progress will sync when you reconnect." message, inline "Try again" link.

- Appears as a dismissible-feeling but auto-managed banner at the top of the current screen — it should disappear automatically on reconnect, not require a manual dismiss.
- "Try again" here does the same connectivity re-check as §11a's button, just inline.
- Any mutation attempted while this banner is showing (mark mastered, submit quiz, etc.) should queue gracefully or clearly fail with a small inline message — pick one behavior and document it; silently losing a tap is not acceptable.

**Detection:** implement connectivity detection once, at the app root (e.g. a network-status hook), not per-screen — both §11a and §11b read from the same source of truth so they never disagree about whether the app is online.

---

## Cross-screen rules that apply everywhere
- Every list screen (Browse by Level, Word Progress) handles three states explicitly: loading, empty, and error.
- Every mutation (mark mastered/learning, favorite toggle, quiz submit, settings save) disables its trigger while in flight.
- Every form (Login's email field, Settings' time picker) preserves entered/selected data on a failed submit.
- Bottom nav's active tab always matches the current screen — no screen should leave the nav in an ambiguous or stale-highlighted state.
- Any change to `word_progress` or `quiz_attempts` must match a documented behavior in `02-ARCHITECTURE.md` §3 — if a screen seems to need something undocumented, update the architecture doc first.
- Any element listed above as "decide and document" is an open decision — track it in `08-PROGRESS-TRACKER.md` until resolved, don't leave it silently ambiguous in the shipped app.