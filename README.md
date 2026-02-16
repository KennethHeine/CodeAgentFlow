# CideAgentFlow

CodeAgentFlow v1 is a lightweight, GitHub-native intent-to-PR orchestration UI.

## v1 constraints implemented

- No database
- No backend runtime state
- No state files (for example, no `state.json`)
- Runtime orchestration data is loaded live from GitHub APIs (issues, PRs, labels, comments, checks, merges)
- Epic repo is treated as a spec store and only `/epics/*.md` entries are surfaced
- GitHub PAT auth is stored in browser storage (`localStorage`) for v1
- Browser cache is optional UI convenience only and not source-of-truth

## Run

Open `/home/runner/work/CideAgentFlow/CideAgentFlow/index.html` in a browser, or serve this folder with any static file server.
