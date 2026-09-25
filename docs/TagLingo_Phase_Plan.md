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

- [ ] Shared components: `Card`, `WordCard` (flip), `LevelCard`, `StatusBadge`, `Button`, `BottomNav`, `SearchBar`
- [ ] Mock fixtures: `/mocks/words.ts`, `/mocks/decks.ts`, `/mocks/progress.ts`
- [ ] Screens: Welcome/Login, Home Dashboard, Browse by Level, Flashcard Study, Definition Lookup, Quiz Question, Quiz Results, Word Progress, Profile, Settings, Offline State
- [ ] Every screen reachable from bottom nav / FAB / card taps
- [ ] Empty and loading-skeleton states built for every list screen

**Exit criterion:** a reviewer can tap through the entire app, every screen, using only mock data — no dead ends.

---

## Phase 2 — Data Layer, Schema & Word Seeding
**Goal:** the database is live in Supabase and populated with real starting vocabulary before any screen is wired to it.

- [ ] Create tables: `users`, `words` (tagalog, cebuano, english, level, example_sentence, audio_url), `word_progress` (user_id, word_id, status: mastered/learning/favorite), `quiz_attempts`
- [ ] Set up RLS: a user can only read/write their own `word_progress` and `quiz_attempts`; `words` is publicly readable, writable only via direct DB/service-role import (no in-app admin panel, per project scope)
- [ ] **Seed the `words` table using `taglingo_words_template.csv`** — import via Supabase Table Editor → Insert → Import data from CSV, or a one-off `supabase db` script. This is the starting Beginner/Intermediate/Advanced dataset; expand it toward the 200–300 word target before Phase 6.
- [ ] Verify seeded rows split correctly across levels (`SELECT level, count(*) FROM words GROUP BY level`)

**Exit criterion:** `words` table is live and seeded from the CSV, levels query returns the expected Beginner/Intermediate/Advanced counts, and RLS blocks a client from writing to another user's `word_progress`.

---

## Phase 3 — Auth & Roles (wire the real thing)
- [ ] Replace mock "Continue with email/Apple/Google" with real Clerk auth
- [ ] Create `users` row on first login
- [ ] Profile screen reads real session data
- [ ] Settings screen (dark mode, reminder toggle) persists to `users` or a `user_settings` row

**Exit criterion:** a real account can log in, land on Home Dashboard, and Profile reflects real data.

---

## Phase 4 — Flashcard Study & Progress (wire the real thing)
- [ ] Browse by Level fetches real word counts and completion % per level from `word_progress`
- [ ] Flashcard Study Mode fetches real words for the selected level
- [ ] Mastered / Still Learning / Favorite writes to `word_progress`, synced in real time (Supabase)
- [ ] Home Dashboard's streak and mastered-word count read real aggregated data
- [ ] Word Progress screen (My Words) fetches real data, filterable by All/Mastered/Learning/Favorites

**Exit criterion:** a word marked Mastered on the Study screen is reflected immediately on Home Dashboard and Word Progress without a manual refresh.

---

## Phase 5 — Definition Lookup & Quiz Mode (wire the real thing)
- [ ] Definition Lookup calls the Free Dictionary API live on tap, renders definition/part of speech/example
- [ ] Quiz Mode: generate a 10-question multiple-choice quiz from `words` at the selected level; distractors pulled from the same level
- [ ] Quiz Results: score + missed-word list, "Review these" deep-links back into Study filtered to those words
- [ ] Quiz attempts recorded in `quiz_attempts` (separate from `word_progress` — quiz results don't auto-mark a word Mastered, per the project's design decision)

**Exit criterion:** a full quiz can be taken end to end with a real score, and a missed word can be reviewed directly from the results screen.

---

## Phase 6 — Notifications & Offline State
- [ ] Study reminder push notification (daily, time configurable in Settings)
- [ ] Offline state screen/banner triggers correctly when connectivity drops, per the design
- [ ] Expand seeded vocabulary from the Phase 2 CSV starting point toward the 200–300 word target across all three levels

**Exit criterion:** a scheduled reminder fires on a test device, and the app shows the offline state (not a blank/broken screen) when connectivity is cut.

---

## Phase 7 — Polish, Test, Submit
- [ ] Full click-through regression pass across both light/dark themes
- [ ] EAS Build → Android APK
- [ ] Rehearse demo: login → browse by level → study → quiz → results → progress sync
- [ ] Final proposal/documentation review

**Exit criterion:** installable APK, full demo runs start to finish, vocabulary dataset meets target word count.