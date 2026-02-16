import test from 'node:test';
import assert from 'node:assert/strict';
import { GitHubClient } from '../../src/lib/githubClient.js';

test('GitHubClient applies auth header and parses response', async () => {
  let seenOptions;
  global.fetch = async (_url, options) => {
    seenOptions = options;
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    };
  };

  const client = new GitHubClient('abc123');
  const result = await client.request('/repos/a/b');

  assert.equal(seenOptions.headers.Authorization, 'Bearer abc123');
  assert.deepEqual(result, { ok: true });
});

test('GitHubClient putContent sends base64 payload', async () => {
  const calls = [];
  global.fetch = async (_url, options) => {
    calls.push(options);
    if (calls.length === 1) {
      return {
        ok: false,
        status: 404,
        text: async () => 'not found',
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ content: { sha: 'new-sha' } }),
    };
  };

  const client = new GitHubClient('abc123');
  await client.putContent({
    owner: 'o',
    repo: 'r',
    path: 'epics/a/goal.md',
    content: 'Hello ✅',
    message: 'msg',
    branch: 'main',
  });

  const payload = JSON.parse(calls[1].body);
  assert.equal(payload.content, 'SGVsbG8g4pyF');
});
