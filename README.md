# CodeAgentFlow

**Intent-driven orchestration UI for PR-based coding agent workflows.**

CodeAgentFlow lets you provide a high-level intent, generates a plan of small PR-friendly tasks, and orchestrates GitHub Copilot Coding Agent runs — one per task — with validation, fix loops, and manual merge approval.

## Features

- **Dashboard** — View all Epics with status (Draft / Running / Blocked / Completed)
- **Create Epic** — Define intent, repo, constraints, validation profile, and merge policy
- **Plan Generation** — Auto-generates 5–12 tasks with acceptance criteria
- **Task State Machine** — PLANNED → RUNNING → PR_READY → VALIDATING → FIXING → APPROVAL_PENDING → MERGED → DONE (with BLOCKED)
- **Validation Runs** — Track CI/test/lint/security check results per task
- **Audit Logging** — Full audit trail of all actions and state transitions
- **No Auto-Merge** — Explicit user approval required before merging

## Tech Stack

- **Frontend & Backend:** Next.js 16 (App Router) with TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** SQLite via better-sqlite3
- **State Management:** Client-side with fetch + React state

## Local Setup

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/KennethHeine/CideAgentFlow.git
cd CideAgentFlow

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

### Configuration

The SQLite database (`codeagentflow.db`) is created automatically in the project root on first API call. It's excluded from version control via `.gitignore`.

#### Environment Variables (optional)

For future GitHub integration, set these in a `.env.local` file:

```env
GITHUB_TOKEN=your_personal_access_token
GITHUB_APP_ID=your_app_id
```

## Data Model

| Entity | Key Fields |
|---|---|
| **Epic** | id, title, intent, repo, defaultBranch, constraints, validationProfile, mergePolicy, status |
| **Task** | id, epicId, order, title, description, acceptanceCriteria[], state, prUrl, branchName, attempts |
| **ValidationRun** | id, taskId, status, checks[], logsUrl |
| **AuditLog** | id, epicId, taskId, action, actor, details |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/epics` | List all epics |
| POST | `/api/epics` | Create epic (with optional plan generation) |
| GET | `/api/epics/:id` | Get epic with tasks and audit logs |
| PATCH | `/api/epics/:id` | Update epic (title, intent, status) |
| DELETE | `/api/epics/:id` | Delete epic and all related data |
| POST | `/api/epics/:id` | Generate plan for existing epic |
| GET | `/api/tasks?epicId=` | List tasks for an epic |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/:id` | Get task with validation runs and audit logs |
| DELETE | `/api/tasks/:id` | Delete a task |
| POST | `/api/tasks/:id/transition` | Transition task state |
| POST | `/api/tasks/:id/validate` | Create or update validation run |
| GET | `/api/audit-logs` | List audit logs (filterable) |

## Task State Machine

```
PLANNED → RUNNING → PR_READY → VALIDATING → APPROVAL_PENDING → MERGED → DONE
                                    ↓ (fail)
                                  FIXING → VALIDATING (retry)

Any state → BLOCKED (requires reason)
BLOCKED → any previous state (unblock)
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## License

MIT
