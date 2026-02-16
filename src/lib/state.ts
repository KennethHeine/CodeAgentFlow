export type IssueLike = {
  title: string
  state: 'open' | 'closed'
  labels?: string[]
  html_url?: string
}

export type PullLike = {
  title: string
  state: 'open' | 'closed'
  merged?: boolean
  draft?: boolean
  html_url?: string
  checkState?: 'success' | 'failure' | 'pending'
}

export type DerivedState = {
  status: 'not-started' | 'in-progress' | 'blocked' | 'done'
  reason: string
  link?: string
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function matchesTitle(task: string, candidate: string) {
  const normalizedTask = normalize(task)
  const normalizedCandidate = normalize(candidate)
  return (
    candidate.toLowerCase().includes(task.toLowerCase()) ||
    normalizedCandidate.includes(normalizedTask) ||
    normalizedTask.includes(normalizedCandidate)
  )
}

export function deriveTaskState(taskTitle: string, issues: IssueLike[], pulls: PullLike[]): DerivedState {
  const relatedIssue = issues.find((issue) => matchesTitle(taskTitle, issue.title))
  const relatedPull = pulls.find((pr) => matchesTitle(taskTitle, pr.title))

  if (relatedPull?.merged) {
    return { status: 'done', reason: 'Merged PR', link: relatedPull.html_url }
  }

  if (relatedIssue?.state === 'closed') {
    return { status: 'done', reason: 'Closed issue', link: relatedIssue.html_url }
  }

  const isBlocked =
    relatedIssue?.labels?.some((label) => label.toLowerCase().includes('blocked')) ||
    relatedPull?.checkState === 'failure'

  if (isBlocked) {
    return { status: 'blocked', reason: 'Blocked label or failing checks', link: relatedIssue?.html_url || relatedPull?.html_url }
  }

  if (relatedPull?.state === 'open') {
    return { status: 'in-progress', reason: relatedPull.draft ? 'Draft PR open' : 'PR open', link: relatedPull.html_url }
  }

  if (relatedIssue?.state === 'open') {
    return { status: 'in-progress', reason: 'Issue open', link: relatedIssue.html_url }
  }

  return { status: 'not-started', reason: 'No GitHub signal yet' }
}
