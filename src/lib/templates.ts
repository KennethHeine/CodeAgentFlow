export type TaskTemplateInput = {
  title: string
  summary?: string
  researchSteps?: string[]
  workSteps?: string[]
}

export function buildEpicTemplates(epicName: string) {
  const intro = `# ${epicName}

This epic is managed entirely from GitHub artifacts. Documents live in the epic repo; execution signals come from issues, PRs, labels, checks, and merges.`

  return {
    goal: `${intro}

## Goal
- Describe what success looks like in user and business terms.
- Note observability and validation signals.

## Outcomes
- Evidence that the goal is achieved.
- Links to the PRs, issues, and checks that prove it.`,
    requirements: `${intro}

## Constraints
- Keep tasks sized to fit within a single Coding Agent run (128k context).
- No backend services or databases.

## Acceptance criteria
- Progress derives from GitHub issues/PRs/checks.
- Documents in this folder are the source of truth for planning.

## Non-goals
- Autonomous merges without human approval.
- Persisting state outside of GitHub artifacts.`,
    plan: `${intro}

## Plan
- Enumerate tasks so each can finish within one Coding Agent run.
- Include research and work steps for every task.

## Tasks
- [ ] Draft the happy path for the epic.
- [ ] Add PR/issue labels that map to tasks.
- [ ] Link verification and roll-back steps.`,
  }
}

export function buildTaskTemplate({
  title,
  summary,
  researchSteps = [],
  workSteps = [],
}: TaskTemplateInput) {
  const research = researchSteps.length
    ? researchSteps.map((step) => `- [ ] ${step}`).join('\n')
    : '- [ ] Capture links and references'

  const work = workSteps.length
    ? workSteps.map((step) => `- [ ] ${step}`).join('\n')
    : '- [ ] Implement change\n- [ ] Add tests\n- [ ] Verify checks'

  const subtitle = summary ? `\n> ${summary}\n` : ''

  return `# ${title}${subtitle}

## Research
${research}

## Work
${work}

## Evidence
- Link to PR/issue/checks
- Screenshots or logs
`
}
