# CodeAgentFlow (frontend)

Developer-first cockpit for orchestrating long-running GitHub work without a backend. The UI keeps the planning source-of-truth in an epic repo (Markdown files) and derives execution state from GitHub issues/PRs/checks.

## Features
- PAT-first login gate: modal appears when no token is cached; explains scopes and keeps the token in local storage only.
- Epic scaffolding: creates `goal.md`, `requirements.md`, `plan.md`, and a starter task under `/epics/<slug>/tasks`.
- Plan builder: add research/work steps and publish task markdown sized for a single Coding Agent run.
- GitHub-as-source-of-truth: document edits write directly to the repo; execution statuses derive from issues/PRs.
- Local caching: directory listings cached with TTL for snappy navigation (GitHub remains authoritative).
- Transparency: deep links back to GitHub artifacts from every panel.

## Getting started
```bash
npm install
npm run dev
```

## Tests
- Unit tests (logic): `npm test` or `npm run test:unit`
- Playwright e2e (PAT modal, create epic, generate plan, navigation): `npm run test:e2e`

## PAT guidance
- Required scopes: `repo`, `workflow`, optionally `project`.
- Storage: the PAT is saved only in browser local storage; clear it with “Clear token” in the header.

## Epic structure
```
/epics/<epic-slug>/
  goal.md
  requirements.md
  plan.md
  /tasks/
    001-bootstrap-epic.md
    ...additional tasks...
```

## Image
- A current UI capture lives at `public/app-preview.png`.
