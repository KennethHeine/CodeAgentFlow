import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveExecutionState } from '../../src/lib/state.js';

test('deriveExecutionState summarizes GitHub artifacts', () => {
  const state = deriveExecutionState({
    issues: [{ state: 'open' }, { state: 'closed' }],
    prs: [{ merged: true }, { merged: false }],
    checks: [{ conclusion: 'success' }, { conclusion: 'failure' }],
  });

  assert.deepEqual(state, {
    openTasks: 1,
    mergedPRs: 1,
    failedChecks: 1,
    status: 'attention',
  });
});
