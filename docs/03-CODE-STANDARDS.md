# TagLingo — Code Standards

## 1. Language & Type Safety
- TypeScript everywhere, `"strict": true` in `tsconfig.json`.
- No `any` without a `// TODO(reason)` comment — prefer `unknown` + narrowing.
- Every Supabase table has a matching type in `/types/database.ts`. Regenerate with `npx supabase gen types typescript` after any schema change and commit the diff.

## 2. Project Structure
```
/app                    # expo-router routes — file-based, mirrors the screen list
  _layout.tsx
/components              # shared, reusable UI (WordCard, LevelCard, StatusBadge, Button, BottomNav)
/features                 # one folder per domain: words/, progress/, quiz/, profile/
  /words
    api.ts               # React Query hooks calling Supabase
    types.ts
/mocks                    # Phase 1 static fixtures — kept after Phase 1, used in tests/storybook
/lib                       # supabase client, clerk config
/constants                 # level list, color tokens
```
- A screen file in `/app` should be thin: layout + hook calls. Business logic and data-fetching live in `/features/*/api.ts`.
- Never inline a Supabase query inside a component — always go through a `/features/*/api.ts` hook.

## 3. Naming Conventions
- Components: `PascalCase.tsx` (`WordCard.tsx`).
- Hooks: `useCamelCase.ts` (`useWordsByLevel.ts`).
- Non-component modules: `camelCase.ts`.
- Route files: lowercase per `expo-router` convention (`browse-by-level.tsx`).
- Enum-like string unions match the Postgres enum values exactly (`"Beginner"`, `"mastered"`) so no translation layer is needed between client and DB.

## 4. Component Patterns
- Functional components only.
- Co-locate a component's styles using `StyleSheet.create` at the bottom of the same file unless the component exceeds ~150 lines.
- Props typed with an explicit `interface ComponentNameProps`.
- Shared components (`/components`) must not import from `/features` — dependency direction is one-way: `app` → `features` → `components`/`lib`.

## 5. State Management
- **Server state:** React Query only. Every list screen (Browse by Level, Word Progress) uses `useQuery`; every mutation (mark mastered, favorite, submit quiz) uses `useMutation` with cache invalidation targeting the exact query keys affected — a word marked Mastered must invalidate the Home Dashboard, Browse by Level, and Word Progress queries together.
- **Local/UI state:** `useState`/`useReducer` — no global store needed for this app's size.
- **Forms:** `react-hook-form` + a `zod` schema per form (Report/Settings forms).

## 6. Error & Loading States
Every list/detail screen must explicitly render three states:
```tsx
if (isLoading) return <SkeletonList />;
if (isError) return <ErrorState onRetry={refetch} />;
if (data.length === 0) return <EmptyState message={...} />;
return <List data={data} />;
```
Definition Lookup additionally needs a fourth, narrower state — "no definition found" (`02-ARCHITECTURE.md` §7 step 4) — which is not the same as a network error and should read differently to the user.

## 7. Mutations
- Disable the trigger (`disabled={isPending}`) for the duration of any in-flight mutation — mark mastered/learning, favorite toggle, quiz submit, settings save.
- On failure, preserve any in-progress form input (e.g. a partially-answered quiz should not reset).

## 8. Linting & Formatting
- ESLint + Prettier. Run `npm run lint` before every commit.
- No `console.log` left in committed code — use a `debug()` helper gated behind `__DEV__`.

## 9. Git Workflow
- You are pushing to the remote repo yourself — this doc assumes a solo or small-team flow rather than prescribing a branching model. Keep commits scoped and messages descriptive (`feat(quiz): generate 10-question quiz per level`), so `08-PROGRESS-TRACKER.md` stays easy to cross-reference against history.

## 10. Testing Discipline
- Every critical-path test in `05-TESTING-REPORT.md` must be manually re-verified before considering a phase in `01-PHASE-PLAN.md` complete.
- Prefer testing against the seeded Phase 2 dataset (`taglingo_words_template.csv`) so results are reproducible.