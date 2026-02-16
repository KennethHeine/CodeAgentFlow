import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePlanTasks } from '../../src/lib/parsing.js';

test('parsePlanTasks extracts numbered plan items', () => {
  const result = parsePlanTasks('# Plan\n1. Build shell\n2. Add tests');

  assert.equal(result.length, 2);
  assert.deepEqual(result[0], { id: '001', title: 'Build shell', slug: 'build-shell' });
});
