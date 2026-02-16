# CodeAgentFlow v1

CodeAgentFlow is an intent-driven orchestration UI for PR-based coding agent workflows.

## What is included in v1

- **Dashboard** for Epic tracking (`Draft`, `Running`, `Blocked`, `Completed`)
- **Create Epic** flow with:
  - title, intent, repo, default branch
  - constraints, validation profile
  - generated editable plan/task list (5-12 tasks)
- **Epic Detail** timeline for task states:
  - `PLANNED → RUNNING → PR_READY → VALIDATING → FIXING → APPROVAL_PENDING → MERGED → DONE`
  - `BLOCKED` can happen at any time (note required)
- **Task Detail** with:
  - task spec/history
  - validation run summary
  - fix-validation thread visibility
- **SQLite persistence** (`codeagentflow.db`) for epics, tasks, validation runs, task events, and audit logs
- **API routes** for plan generation, epic/task retrieval, and task actions
- **Manual merge control**: explicit `Approve merge` then `Merge`

## Local setup

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

## Configuration notes

- Database file: `codeagentflow.db` (auto-created in project root)
- Validation simulation:
  - Use **Re-run validation** in UI
  - Provide `PASSED` or `FAILED` when prompted
- Merge policy is fixed in v1: `MANUAL_APPROVAL_REQUIRED`

## Useful scripts

```bash
npm run dev
npm run lint
npm run build
```
