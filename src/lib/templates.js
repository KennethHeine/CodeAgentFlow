export function slugifyEpicName(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function goalTemplate(name) {
  return `# Goal\n\nImplement ${name}.\n\n## Success\n- Developer-first workflow\n- Manual approval and merge`;
}

export function requirementsTemplate() {
  return `# Requirements\n\n## Constraints\n- No backend\n- GitHub source of truth\n\n## Acceptance Criteria\n- PAT-first login gate\n- Tests for core logic and critical flows`;
}

export function planTemplate(name) {
  return `# Plan\n\n1. Scaffold frontend shell for ${name}\n2. Implement PAT-first GitHub access gate\n3. Add epic file scaffolding and GitHub write flow\n4. Add unit and Playwright tests`;
}
