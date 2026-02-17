# AGENTS.md

> The primary operating manual for AI coding agents working in this repository.

## Project Snapshot

- **App**: CodeAgentFlow — a developer-first React frontend for planning and orchestrating long-running work via GitHub Copilot Coding Agent
- **Stack**: TypeScript, React 19, Vite 7, Vitest 4, Playwright, ESLint
- **Runtime**: Node.js (use latest LTS; no `.nvmrc` pinned)
- **Package manager**: npm (lockfile: `package-lock.json`)
- **No backend/database** — all state derived from GitHub (Markdown files in an epic repo) and browser localStorage
- **GitHub API**: `@octokit/rest` for all GitHub interactions
- **Styling**: Plain CSS (no CSS framework), dark theme
- **Icons**: `lucide-react`
- **Testing**: Vitest (unit, jsdom) + Playwright (E2E, Chromium)
- **Layout**: all application code lives at the repository root

## Golden Commands

All commands are run from the repository root:

| Task | Command | Notes |
|---|---|---|
| Install deps | `npm ci` | Use `ci` for reproducible installs |
| Dev server | `npm run dev` | Starts Vite dev server |
| Build | `npm run build` | Runs `tsc -b && vite build` |
| Unit tests | `npm test` | Vitest, ~50 tests, fast (<5s) |
| Unit tests (watch) | `npm run test:watch` | Vitest in watch mode |
| E2E tests | `npm run build && npm run test:e2e` | Playwright; requires build first |
| Lint | `npm run lint` | ESLint (flat config) |
| Typecheck | `npx tsc -b` | Included in build, but can run standalone |
| Preview (prod) | `npm run preview` | Serves built app on `localhost:4173` |

### Quick validation before opening a PR

```bash
npm run build && npm run lint && npm test
```

## Project Map

```
/                         # Repo root
├── AGENTS.md             # This file — agent operating manual
├── README.md             # Project overview, screenshots, getting started
├── LICENSE               # MIT
├── docs/images/          # Screenshots for README
├── package.json          # Dependencies & scripts
├── vite.config.ts        # Vite bundler config
├── vitest.config.ts      # Vitest test config (jsdom, setup file)
├── eslint.config.js      # ESLint flat config (TS + React hooks + React Refresh)
├── tsconfig.json         # TypeScript project references
├── tsconfig.app.json     # App TS config (strict, ES2022, react-jsx)
├── tsconfig.node.json    # Node TS config
├── playwright.config.ts  # E2E config (Chromium, localhost:4173)
├── index.html            # Entry HTML
├── public/               # Static assets
├── src/
│   ├── main.tsx          # React entry point
│   ├── App.tsx           # Root component (PAT gate → repo selector → IDE layout)
│   ├── App.css           # Global styles
│   ├── components/       # React UI components, grouped by feature
│   │   ├── auth/         # Authentication: PatModal
│   │   ├── epic/         # Epic management: EpicDetail, EpicWizard
│   │   ├── layout/       # App shell: Header, Sidebar
│   │   └── repo/         # Repository selection: RepoSelector
│   ├── hooks/            # Custom hooks (useAuth, useEpics, useKeyboardShortcut)
│   ├── services/         # GitHub API client (Octokit wrapper)
│   ├── types/            # TypeScript type definitions (epic.ts, github.ts)
│   ├── utils/            # Utility functions (slugify, storage, templates)
│   ├── test/             # Test setup (setup.ts imports @testing-library/jest-dom)
│   ├── index.css         # Base styles
│   └── assets/           # Bundled assets
└── e2e/                  # Playwright E2E tests
    └── app.spec.ts       # PAT modal & navigation tests
```

### Do-not-touch areas

- `package-lock.json` — do not manually edit; run `npm install` to update
- `docs/images/` — binary screenshots; do not regenerate without explicit request

## Guardrails & Safety

- **Never commit secrets** — PATs, API keys, tokens must never appear in source code or commits
- **No `.env` file is used** — the app stores the GitHub PAT in browser localStorage only (key: `codeagentflow:github-pat`); there is no `.env.example`
- **localStorage keys** use the `codeagentflow:` prefix
- **Avoid destructive commands** — do not run `rm -rf`, `git push --force`, or drop/reset operations unless explicitly requested
- **Base64 encoding** uses UTF-8-safe methods (TextEncoder/TextDecoder) — maintain this pattern
- **Error handling** — all catch blocks should log with `console.error` and set error state; never silently swallow errors
- **Accessibility** — modals use `role="dialog"`, `aria-modal`, `aria-labelledby`; icon-only buttons must have `aria-label`
- **Input validation** — repo format validated with `isValidRepoFormat()` (exactly 2 non-empty parts split by `/`)

## Definition of Done

When finishing any code change, ensure:

1. **Tests**: Add or update tests for new/changed behavior. Unit tests go in `src/**/*.test.{ts,tsx}`, E2E tests in `e2e/`. If no tests are needed, explicitly justify why.
2. **Docs**: Update `README.md`, `AGENTS.md`, or relevant docs if behavior, configuration, or developer workflow changes.
3. **Validation**: Run the full validation suite before opening a PR:
   ```bash
   npm run build && npm run lint && npm test
   ```
4. **PR hygiene**: Keep diffs small and focused. Include a clear summary of what changed, which commands were run, and their results.
5. **No regressions**: Confirm existing tests still pass after your changes.
