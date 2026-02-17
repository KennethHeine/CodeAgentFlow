# Copilot Instructions

> Repo-wide guidance for GitHub Copilot. Read on every request.

## How This Repo Is Structured

CodeAgentFlow is a React 19 + TypeScript SPA (single-page application) that lives entirely in the `frontend/` directory. There is no backend — all data comes from GitHub's API via `@octokit/rest` and is stored as Markdown files in a user-selected GitHub repository. Browser localStorage is used for session state (PAT, repo selection).

Key entry points:
- `frontend/src/main.tsx` → React root
- `frontend/src/App.tsx` → Application shell (PAT gate → repo selector → IDE layout)
- `frontend/src/services/github.ts` → All GitHub API interactions
- `frontend/src/types/` → Shared TypeScript types

## Coding Conventions

- **TypeScript strict mode** — `strict: true`, `noUnusedLocals`, `noUnusedParameters` in `tsconfig.app.json`
- **Functional components only** — use React hooks, no class components
- **Named exports** — components and hooks use named exports; barrel files (`index.ts`) re-export
- **CSS** — plain CSS files co-located with components; dark theme; no CSS-in-JS or framework
- **No default exports** except `App.tsx` (Vite convention)
- **Error handling** — wrap async operations in try/catch; log errors with `console.error`; set user-visible error state
- **localStorage** — keys prefixed with `codeagentflow:`; use `getStorageItem`/`setStorageItem` helpers from `utils/storage.ts`
- **Accessibility** — modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`; icon-only buttons: `aria-label`
- **Base64** — use UTF-8-safe encode/decode via TextEncoder/TextDecoder (see `services/github.ts`)

## Validation Checklist

Run these commands from `frontend/` before opening any PR:

```bash
cd frontend
npm run build     # TypeScript compilation + Vite build
npm run lint      # ESLint (flat config, TS + React rules)
npm test          # Vitest unit tests (~50 tests, <5s)
```

For UI changes that affect E2E flows:
```bash
npm run build && npm run test:e2e   # Playwright (Chromium)
```

## Testing Expectations

- **Unit tests** (`src/**/*.test.{ts,tsx}`): Add tests for new utility functions, hooks, and component behavior. Use Vitest + React Testing Library + jsdom.
- **E2E tests** (`e2e/*.spec.ts`): Add tests for new user-facing flows or when modifying existing UI interactions. Use Playwright.
- **Test setup**: `src/test/setup.ts` imports `@testing-library/jest-dom` for DOM matchers.
- **When to skip tests**: Pure CSS changes, documentation-only changes, or config file updates that are validated by build/lint.

## Documentation Expectations

- Update `README.md` when adding features, changing commands, or modifying project structure.
- Update `AGENTS.md` when changing build commands, project layout, or developer workflow.
- Keep screenshots in `docs/images/` current if UI changes significantly.

## Important Note

**`AGENTS.md` is the primary operating manual for agents in this repo.** Refer to it for golden commands, project map, guardrails, and definition of done.
