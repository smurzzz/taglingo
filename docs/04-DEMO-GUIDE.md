# TagLingo — Demo Guide

**Target length:** 5-6 minutes. Rehearse this at least twice before presenting.

## 0. Before you start
- [ ] Confirm the test account is logged out (fresh login makes onboarding visible)
- [ ] Confirm the seeded `words` dataset is loaded (at least the CSV template, ideally the expanded set)
- [ ] Confirm the device has a working internet connection — this is a fully online app, so a dead connection is the one thing that will visibly break the demo
- [ ] Have the Offline State screen ready to show deliberately (airplane mode toggle handy) as a planned beat, not an accident

## 1. Cold open (20s)
State the problem in one sentence: most vocabulary apps ignore Filipino languages entirely. TagLingo is a level-based Tagalog/Cebuano-English flashcard app with quizzing and real-time progress tracking, built specifically to fill that gap.

## 2. Login & Home Dashboard (30s)
1. Log in with real Clerk auth (email or Google/Apple).
2. Land on **Home Dashboard** — point out the daily streak and mastered word count are both live, pulled from the same `word_progress`/`study_sessions` data.

## 3. Browse by Level (30s)
1. Tap **Browse**.
2. Show the three level cards (Beginner/Intermediate/Advanced) with word counts and completion %.
3. Tap into **Beginner**.

## 4. Flashcard Study Mode (60s)
1. Show a word card (e.g. "salamat"), tap to flip and reveal the English translation.
2. Tap the English translation to trigger **Definition Lookup** — narrate that this is the one live API call in the whole app (Free Dictionary API, proxied through the Next.js route so the app never calls a third party directly).
3. Mark the word **Mastered**.
4. Navigate back to Home Dashboard — show the mastered count updated immediately, no manual refresh.

## 5. Quiz Mode (60s)
1. From Browse by Level, start a **Quiz** for the same level.
2. Answer a few questions, including at least one wrong on purpose so Quiz Results has something to show.
3. Show the score and the missed-word list.
4. Tap **Review these** — show it deep-links back into Flashcard Study Mode, filtered to just the missed words.

## 6. Word Progress & Profile (30s)
1. **Progress tab** — show the filterable word list (All/Mastered/Learning/Favorites).
2. **Profile** — show streak and weekly study history chart.

## 7. Offline state (20s) — optional, deliberate beat
1. Toggle airplane mode.
2. Show the Offline State screen/banner appears instead of a blank or broken UI.
3. Toggle connectivity back on, show it recovers.

## 8. Close (15s)
One sentence: every word is pre-seeded and read-only, every progress number is computed live from one source of truth, and the only external call in the app is the definition lookup — a deliberately small, defensible v1.

## Questions to be ready for
- "Why level-based instead of topic decks?" → Simpler to seed consistently solo, and matches the 8-week build scope — documented as a deliberate design decision.
- "Why doesn't a correct quiz answer mark a word Mastered?" → Quiz Mode is reinforcement/testing; mastery stays a user judgment made in Flashcard Study, per `02-ARCHITECTURE.md` §3.5.
- "What happens with no internet?" → The Offline State screen (§7 above) — the app is intentionally online-only, no offline sync layer, a scoped tradeoff documented from the start.