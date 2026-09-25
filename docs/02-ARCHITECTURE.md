# TagLingo — Architecture

## 1. System Overview

TagLingo is a mobile client (Expo/React Native) talking to two backend pieces: **Supabase** (Postgres + Row-Level Security) for all user data and progress, and a thin **Next.js API Routes** layer for the one operation that shouldn't be called directly from the client with a hardcoded key — the live English definition lookup.

```
[Expo App] ──auth──> [Clerk]
     │
     ├──reads/writes (RLS-scoped)──> [Supabase Postgres]
     │
     └──calls──> [Free Dictionary API]   (direct, no proxy — no server CORS on native)
```

> Phase 5 moved the definition lookup client-side: React Native has no browser CORS, so the Expo app calls `https://api.dictionaryapi.dev` directly instead of proxying through Next.js (see §7). There is deliberately no admin panel and no write path into `words` from the client — vocabulary is seeded directly into Supabase (see `01-PHASE-PLAN.md` Phase 2).

## 2. Roles

TagLingo has a single authenticated role in v1: **Student Learner / Casual User** — both are the same `users.role = 'learner'` account; the "casual" distinction in `00-PROJECT-OVERVIEW.md` §5 is a usage pattern, not a separate permission level. There is no staff/admin role, since deck management happens outside the app.

## 3. Data Model

### 3.1 `users`
| Column | Type | Notes |
|---|---|---|
| `id` | text, PK | Clerk subject id (`sub` claim); written by `ensure_user()` on first login (Phase 3) |
| `email` | text, unique | |
| `full_name` | text | |
| `dark_mode` | boolean | default `false` |
| `reminder_enabled` | boolean | default `true` |
| `reminder_time` | time | default `19:30` |
| `created_at` | timestamptz | default `now()` |

### 3.2 `words`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `tagalog` | text | |
| `cebuano` | text | |
| `english` | text | |
| `level` | enum(`Beginner`,`Intermediate`,`Advanced`) | |
| `example_sentence` | text, nullable | |
| `audio_url` | text, nullable | Storage path, if/when audio is added |
| `created_at` | timestamptz | default `now()` |

Seeded from `taglingo_words_template.csv` (see `01-PHASE-PLAN.md` Phase 2; expanded in Phase 6 to 165 words: Beginner 68 / Intermediate 61 / Advanced 36). Read-only for all client roles — no `INSERT`/`UPDATE`/`DELETE` grant exists for authenticated users on this table. A unique index on `(tagalog, cebuano, english)` (Phase 6 expansion migration) makes future CSV-driven imports idempotent.

### 3.3 `word_progress`
One row per (user, word) pair — created the first time a user interacts with a word.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `users.id` | |
| `word_id` | uuid, FK → `words.id` | |
| `status` | enum(`learning`,`mastered`,`new`) | default `new` (added Phase 4) |
| `is_favorite` | boolean | default `false` |
| `updated_at` | timestamptz | trigger-maintained |

Unique constraint on `(user_id, word_id)` — upsert on every flashcard interaction.

A favorite is tracked on the same row, so a word that has only been favorited (no grade yet) keeps `status = 'new'`. Phase 4's favorite toggle deletes the row again when un-favoriting a `new`-only row (it was pure metadata), and instead clears its flag on rows that carry a real grade.

### 3.4 `study_sessions`
Used to compute the daily streak shown on Home Dashboard and Profile.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `users.id` | |
| `studied_on` | date | |
| `created_at` | timestamptz | default `now()` |

Unique constraint on `(user_id, studied_on)` — upserted once per day the first time a user interacts with a flashcard or quiz that day. Streak = count of consecutive `studied_on` dates ending today or yesterday.

### 3.5 `quiz_attempts`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `users.id` | |
| `level` | enum(`Beginner`,`Intermediate`,`Advanced`) | |
| `score` | integer | |
| `total_questions` | integer | default `10` |
| `missed_word_ids` | jsonb | array of `word_id`s answered incorrectly |
| `created_at` | timestamptz | default `now()` |

Quiz results are tracked **separately** from `word_progress` by design — a correct quiz answer does not automatically mark a word `mastered`. Mastery is only ever set from the Flashcard Study screen, where the user makes that judgment directly. Quiz Mode is a testing/reinforcement layer on top of the same word pool, not an alternate way to set progress.

## 4. Row-Level Security

Auth note (Phase 3): Supabase is configured as the **Clerk third-party-auth provider**, so request tokens are Clerk JWTs (verified against the Clerk JWKS) whose `sub` is the Clerk user id and whose `role` is `authenticated`. RLS therefore compares against the JWT subject claim — `auth.jwt()->>'sub'` — not `auth.uid()`. Every FK that pointed at `users.id` is now `text` matching that claim.

- `users`: a user can read/update only their own row (`id = auth.jwt()->>'sub'`).
- `words`: `SELECT` open to all authenticated users; no client-side write grant at all.
- `word_progress`: a user can `SELECT`/`INSERT`/`UPDATE` only rows where `user_id = auth.jwt()->>'sub'`.
- `study_sessions`: same pattern — a user can only read/write their own rows.
- `quiz_attempts`: same pattern — insert/read own rows only.
- `users` rows are created exclusively by the SECURITY DEFINER `public.ensure_user(...)` RPC (no INSERT policy on `users`; the client can only ever touch its own row).

## 5. Level Browsing & Completion

**Browse by Level** shows, per level: total word count (`words` filtered by `level`) and completion % (`word_progress` rows with `status = 'mastered'` for that level, divided by total words in that level, for the current user). This is a live aggregate query, not a stored/cached field, to avoid a second source of truth drifting from `word_progress`.

## 6. Quiz Generation Logic

1. User selects a level on Browse by Level → taps into Quiz Mode.
2. Pull `words` for the selected level and pick up to 10 random words (a level smaller than 10 yields one question per word).
3. For each question word: the correct answer is its `english` value; 3 distractors are randomly pulled from **other words in the same level** (never a different level — this keeps difficulty consistent, per the original design decision).
4. On quiz completion: insert one `quiz_attempts` row with `score`, `total_questions` (the actual question count), and `missed_word_ids`. A finished quiz also touches `study_sessions` for the streak (§3.4) but never `word_progress`.
5. Quiz Results screen reads the in-memory attempt (`state.lastQuiz`, §3.5), joins `missed_word_ids` back to `words` for display, and "Review these" deep-links into Flashcard Study Mode pre-filtered to just those word IDs.

## 7. Definition Lookup API Contract

Mobile ships no API route — React Native has no browser CORS, so the client calls the Free Dictionary API directly (`https://api.dictionaryapi.dev/api/v2/entries/en/:word`) when a user taps a word's English translation (Expo screen `DefinitionSheet`). This matches the original web prototype's `GET /api/definitions/:word` contract:

**Behavior:**
1. Validate `:word` — from a seeded DB `words.english` value, so it is always a non-empty, reasonably short string.
2. Call the Free Dictionary API live.
3. Normalize the response to fill in the Word's display-only fields:
```json
{
  "word": "thank you",
  "partOfSpeech": "interjection",
  "definition": "used to express gratitude or polite appreciation.",
  "example": "Thank you for your help."
}
```
4. If the Free Dictionary API returns no match, an unparseable response, or fails at the network level, resolve `{ "found": false }` rather than an error — the client shows a graceful "No definition available" state, never an error screen (see `07-FUNCTIONALITY-PROMPT.md` §5).

This is the **only** live third-party API call in the system. Tagalog and Cebuano vocabulary pairs are pre-seeded (§3.2) — there is no live translation call for the Filipino-language side of any card.

## 8. Non-Functional Notes

- **Security:** `words` being read-only for all client roles removes an entire class of data-integrity risk; there's no path for a user to corrupt shared vocabulary data.
- **Consistency:** completion percentages and streaks are computed live from `word_progress`/`study_sessions` rather than cached counters, so there's exactly one source of truth per user-facing number.
- **Offline handling:** the app requires connectivity for all reads/writes (`00-PROJECT-OVERVIEW.md` §4.2); the Offline State screen (`07-FUNCTIONALITY-PROMPT.md` §11) is the only UI response to connectivity loss. React Query's `onlineManager` is bridged to NetInfo so queries that failed while offline auto-refetch the moment the network returns (no manual retry, _idempotent_ since all writes are RLS-scoped upserts); there is still no local write queue in v1.

## 9. Notifications — Daily Study Reminder

A **local scheduled notification**, not a push server: there is no APNs/FCM/`expo push` infrastructure for v1. `src/features/notifications/api.ts` owns the whole surface:

- `Notifications.setNotificationHandler` (module scope) chooses banner + list + sound and no badge while the app is foregrounded.
- Native Android channel `study-reminders` (importance DEFAULT) is created before scheduling.
- `scheduleDailyReminder(enabled, time)` schedules exactly one repeating **DAILY** trigger (`SchedulableTriggerInputTypes.DAILY`, `hour`/`minute`, `channelId`) under the fixed identifier `daily-study-reminder`; disabling cancels it. Re-scheduling under the same id replaces, never stacks.
- `useReminderNotification()` reconciles the schedule with the persisted `users.reminder_enabled`/`reminder_time` and is mounted at boot in `_layout.tsx` (`<ReminderSync/>`).
- `getReminderPermission`/`requestReminderPermission` treat iOS `PROVISIONAL` as granted; Settings requests permission only when the user flips the toggle on, keeps the switch off on denial, and shows a `notifications-denied` hint (and can't show a false "enabled" state — deny-on-enable means the schedule never runs).
- `useNotificationObserver` (same sync component) deep-links a tapped reminder back to Home via `useLastNotificationResponse` + `data.url: "/"`.

Because this is a local notification it requires no backend keys and works identically in mock/no-keys dev mode.