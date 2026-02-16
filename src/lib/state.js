export const PAT_STORAGE_KEY = 'caf.github.pat';

export function deriveExecutionState({ issues = [], prs = [], checks = [] }) {
  const openTasks = issues.filter((issue) => issue.state === 'open').length;
  const mergedPRs = prs.filter((pr) => pr.merged === true).length;
  const failedChecks = checks.filter((check) => check.conclusion === 'failure').length;

  return {
    openTasks,
    mergedPRs,
    failedChecks,
    status: failedChecks > 0 ? 'attention' : openTasks === 0 ? 'done' : 'in-progress',
  };
}
