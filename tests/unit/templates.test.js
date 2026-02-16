import test from 'node:test';
import assert from 'node:assert/strict';
import { goalTemplate, planTemplate, requirementsTemplate, slugifyEpicName } from '../../src/lib/templates.js';

test('templates return expected scaffold content', () => {
  assert.match(goalTemplate('Feature X'), /Feature X/);
  assert.match(requirementsTemplate(), /PAT-first login gate/);
  assert.match(planTemplate('Feature X'), /Implement PAT-first GitHub access gate/);
  assert.equal(slugifyEpicName(' Feature X v1 '), 'feature-x-v1');
});
