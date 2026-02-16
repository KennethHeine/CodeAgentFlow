import type { TaskState, GitHubIssue, GitHubPR, GitHubCheckRun } from './types';

/** Valid transitions from each state */
const TRANSITIONS: Record<TaskState, TaskState[]> = {
  PLANNED: ['RUNNING', 'BLOCKED'],
  RUNNING: ['PR_READY', 'BLOCKED'],
  PR_READY: ['VALIDATING', 'BLOCKED'],
  VALIDATING: ['APPROVAL_PENDING', 'FIXING', 'BLOCKED'],
  APPROVAL_PENDING: ['MERGED', 'FIXING', 'BLOCKED'],
  FIXING: ['VALIDATING', 'BLOCKED'],
  MERGED: ['DONE'],
  DONE: [],
  BLOCKED: [
    'PLANNED',
    'RUNNING',
    'PR_READY',
    'VALIDATING',
    'APPROVAL_PENDING',
    'FIXING',
  ],
};

/** Check whether a transition from one state to another is allowed */
export function canTransition(from: TaskState, to: TaskState): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Return the list of states reachable from the current state */
export function getNextStates(current: TaskState): TaskState[] {
  return TRANSITIONS[current];
}

/**
 * Derive the current task state from GitHub artifacts.
 *
 * Priority order:
 * 1. "blocked" label on issue or PR → BLOCKED
 * 2. PR merged + issue closed → DONE
 * 3. PR merged → MERGED
 * 4. PR open, checks failing → FIXING
 * 5. PR open, checks passing → APPROVAL_PENDING
 * 6. PR open, not draft → PR_READY (no checks yet)
 * 7. PR open, draft → RUNNING
 * 8. Issue exists, no PR → RUNNING
 * 9. Nothing → PLANNED
 */
export function deriveTaskState(
  issue?: GitHubIssue,
  pr?: GitHubPR,
  checks?: GitHubCheckRun[],
): TaskState {
  const hasBlockedLabel =
    issue?.labels.some((l) => l.name.toLowerCase() === 'blocked') ||
    pr?.labels.some((l) => l.name.toLowerCase() === 'blocked');

  if (hasBlockedLabel) return 'BLOCKED';

  if (pr) {
    if (pr.merged) {
      if (issue && issue.state === 'closed') return 'DONE';
      return 'MERGED';
    }

    if (pr.state === 'open') {
      if (pr.draft) return 'RUNNING';

      if (checks && checks.length > 0) {
        const allComplete = checks.every((c) => c.status === 'completed');
        const successConclusions = ['success', 'neutral', 'skipped'];
        if (allComplete) {
          const hasFailing = checks.some(
            (c) => !successConclusions.includes(c.conclusion ?? ''),
          );
          if (hasFailing) return 'FIXING';
          return 'APPROVAL_PENDING';
        }
        // Checks still running
        return 'VALIDATING';
      }

      return 'PR_READY';
    }
  }

  if (issue) return 'RUNNING';

  return 'PLANNED';
}
