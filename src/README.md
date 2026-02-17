# Source Navigation Guide

Quick reference for navigating the `src/` codebase.

## Entrypoints

| File | Purpose |
|---|---|
| `main.tsx` | React root — mounts `<App />` into the DOM |
| `App.tsx` | Application shell — PAT gate → repo selector → IDE layout |

## Directory Structure

```
src/
├── components/          # UI components, grouped by feature
│   ├── auth/            # Authentication flow (PatModal)
│   ├── epic/            # Epic CRUD (EpicDetail, EpicWizard)
│   ├── layout/          # App shell (Header, Sidebar)
│   └── repo/            # Repository selection (RepoSelector)
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # PAT authentication state
│   ├── useEpics.ts      # Epic CRUD operations
│   └── useKeyboardShortcut.ts  # Global keyboard shortcuts
├── services/            # External API clients
│   └── github.ts        # Octokit wrapper (all GitHub API calls)
├── types/               # Shared TypeScript types
│   ├── epic.ts          # Epic, Task, Subtask, EpicCreationState
│   └── github.ts        # GitHubUser, GitHubRepo, GitHubContent, etc.
├── utils/               # Pure utility functions
│   ├── slugify.ts       # String → slug conversion, task filename helpers
│   ├── storage.ts       # localStorage wrapper (get/set/remove, PAT helpers)
│   └── templates.ts     # Markdown rendering and parsing for epics/tasks
└── test/                # Test infrastructure
    ├── setup.ts         # Vitest setup (@testing-library/jest-dom)
    └── fixtures.ts      # Shared factory functions (createTask, createEpic, etc.)
```

## Where Things Live

| Looking for… | Go to… |
|---|---|
| GitHub API calls | `services/github.ts` |
| Epic/task data types | `types/epic.ts` |
| GitHub data types | `types/github.ts` |
| Markdown rendering/parsing | `utils/templates.ts` |
| localStorage access | `utils/storage.ts` |
| Auth logic (PAT verification) | `hooks/useAuth.ts` + `services/github.ts` |
| Epic CRUD logic | `hooks/useEpics.ts` |

## Naming & Dependency Rules

- **Components** import from `hooks/`, `services/`, `types/`, and `utils/` — never from other component groups.
- **Hooks** import from `services/`, `types/`, and `utils/` — never from `components/`.
- **Services** import from `types/` only.
- **Utils** import from `types/` only (pure functions, no side effects except `storage.ts`).
- **Types** have no internal imports — they are leaf modules.
- **Barrel files** (`index.ts`) re-export named exports for clean imports.

## Test Co-location

Unit tests live alongside their source files (81 tests across 8 files):
- `components/auth/PatModal.test.tsx`
- `components/epic/EpicDetail.test.tsx`
- `components/repo/RepoSelector.test.tsx`
- `hooks/useKeyboardShortcut.test.ts`
- `services/github.test.ts`
- `utils/slugify.test.ts`
- `utils/storage.test.ts`
- `utils/templates.test.ts`

Shared test factories live in `test/fixtures.ts` (see [TESTING.md](../TESTING.md)).

E2E tests live in `e2e/`.
