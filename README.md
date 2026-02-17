# CodeAgentFlow

A developer-first frontend for planning and orchestrating long-running work by turning high-level intent into a sequence of small, PR-friendly tasks, then driving GitHub Copilot Coding Agent runs to execute them safely over time.

## Features

- **PAT-first login gate** – Modal on first load for GitHub Personal Access Token entry, with scope guidance and local-only storage
- **Epic management** – Create, list, and view epics with goal, requirements, plan, and tasks
- **Epic creation wizard** – Step-by-step flow: Name → Goal → Requirements → Plan → Tasks with subtasks (research & work steps)
- **IDE-like layout** – Sidebar navigation, tabbed epic detail view, keyboard shortcuts
- **GitHub as source of truth** – All epic content stored as Markdown files in a GitHub repo; progress derived from GitHub artifacts
- **Transparency** – Deep-links to GitHub issues, PRs, checks, and Markdown specs
- **Dark theme** – Modern, clean design optimized for developer productivity

## Screenshots

### PAT Login Gate
The app greets new users with a PAT modal that explains required scopes and storage policy.

![PAT Modal](docs/images/01-pat-modal.png)

### Main Layout — Epic Overview
IDE-like shell with sidebar navigation, epic tree, and tabbed detail view showing task stats and file listing.

![Main Layout](docs/images/04-main-layout.png)

### Tasks View
Task cards with status indicators, subtask lists, and GitHub deep-links to issues and PRs.

![Tasks View](docs/images/05-tasks-view.png)

### Goal View
Markdown content rendered in a code-style view for each epic document tab.

![Goal View](docs/images/06-goal-view.png)

### Epic Creation Wizard — Name Step
Step-by-step wizard with progress indicators. Auto-generates a slug from the epic name.

![Wizard Name](docs/images/07-wizard-name.png)

### Epic Creation Wizard — Goal Step
Multi-step flow: Name → Goal → Requirements → Plan → Tasks with Markdown support.

![Wizard Goal](docs/images/08-wizard-goal.png)

## Getting Started

```bash
npm install
npm run dev
```

## Testing

```bash
# Unit tests (Vitest — 81 tests across 8 files)
npm test

# E2E tests (Playwright — Chromium)
npm run build
npm run test:e2e
```

See [TESTING.md](TESTING.md) for conventions, fixtures, and best practices.

## Project Structure

```
src/
  components/       # React UI components, grouped by feature
    auth/           # PAT authentication (PatModal)
    epic/           # Epic management (EpicDetail, EpicWizard)
    layout/         # App shell (Header, Sidebar)
    repo/           # Repository selection (RepoSelector)
  hooks/            # Custom React hooks (useAuth, useEpics, useKeyboardShortcut)
  services/         # GitHub API client (Octokit wrapper)
  types/            # TypeScript type definitions (epic.ts, github.ts)
  utils/            # Utility functions (slugify, storage, templates)
  test/             # Test setup and shared fixtures
e2e/                # Playwright E2E tests
docs/images/        # Screenshots for README
scripts/            # Azure provisioning scripts
```

## CI/CD

- **CI** (`ci.yml`) — Runs build, unit tests, and E2E tests on every pull request
- **Deploy PR Preview** (`deploy-pr.yml`) — Deploys PR preview to Azure Static Web Apps
- **Deploy Production** (`deploy-production.yml`) — Deploys to production on push to `main`
- **Dependabot** — Daily npm updates and weekly GitHub Actions updates, with auto-merge on passing CI

## Known Issues

- **`eslint-plugin-react-hooks` canary version** — ESLint 10 is used in this project, but the latest stable release of `eslint-plugin-react-hooks` (v7.0.1) only supports ESLint up to v9. Until the React team publishes a stable release with ESLint 10 support, this project uses the canary version of the plugin. Track progress at [facebook/react#35758](https://github.com/facebook/react/issues/35758).

## Epic Repo Structure

Epics are stored as Markdown files in a user-selected GitHub repository:

```
/epics/<epic-name>/
  goal.md
  requirements.md
  plan.md
  /tasks/
    001-<task-slug>.md
    002-<task-slug>.md
```