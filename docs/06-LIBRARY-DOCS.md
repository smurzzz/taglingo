# TagLingo — Library Docs

## 1. Version Pinning Policy
Exact versions (no `^`/`~`) for `expo`, `@clerk/clerk-expo`, and `@supabase/supabase-js`. Everything else may use caret ranges, but lock the file and commit it.

## 2. Core Dependencies

| Package | Purpose | Pin policy |
|---|---|---|
| `expo` | App framework/runtime | Exact version |
| `expo-router` | File-based navigation | Caret, matches Expo SDK compatibility table |
| `expo-notifications` | Daily study reminder push notifications | Caret |
| `@clerk/clerk-expo` | Authentication (email, Apple, Google) | Exact version |
| `@supabase/supabase-js` | Database client, real-time progress sync | Exact version |
| `@tanstack/react-query` | Server state, caching, invalidation | Caret |
| `react-hook-form` | Form state (Report/Settings forms) | Caret |
| `zod` | Schema validation, paired with `react-hook-form` | Caret |

## 3. Backend (Next.js API Routes)
Not an npm dependency of the mobile app itself, but part of the stack per `00-PROJECT-OVERVIEW.md` §6:

| Piece | Purpose |
|---|---|
| Next.js API Route: `GET /api/definitions/:word` | Proxies the Free Dictionary API server-side (`02-ARCHITECTURE.md` §7) — the mobile app never calls the third-party API directly |

## 4. Dev Dependencies

| Package | Purpose |
|---|---|
| `eslint` | Linting |
| `prettier` | Formatting |
| `typescript` | Type checking, `strict: true` |

## 5. Install Commands
```
npx expo install expo-router expo-notifications
npm install @clerk/clerk-expo @supabase/supabase-js @tanstack/react-query react-hook-form zod
npm install -D eslint prettier typescript
```

## 6. External Services (not npm packages)

| Service | Purpose | Where credentials live |
|---|---|---|
| Clerk | Auth (email, Apple, Google sign-in) | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env` |
| Supabase | Postgres, RLS, real-time sync | `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env` |
| Free Dictionary API (dictionaryapi.dev) | Live English definitions | No key required; called only from the Next.js API route, never the client |
| EAS Build | Android APK compilation | Linked via `eas init` |

## 7. Level List (client-side enum, referenced by `words.level`)
Beginner · Intermediate · Advanced

Keep this in exactly one place (`/constants/levels.ts`) and import it everywhere a level picker or filter is rendered.

## 8. Updating This Doc
Any time a dependency is added, removed, or re-pinned outside a routine caret bump, update this file in the same change.