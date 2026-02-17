import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('GitHub service', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('getClient', () => {
    it('throws when client is not initialized', async () => {
      const { getClient } = await import('./github');
      expect(() => getClient()).toThrow('GitHub client not initialized');
    });

    it('returns client after initialization', async () => {
      const { initGitHubClient, getClient } = await import('./github');
      initGitHubClient('ghp_test_token_123');
      const client = getClient();
      expect(client).toBeDefined();
    });
  });

  describe('initGitHubClient', () => {
    it('creates a new Octokit instance', async () => {
      const { initGitHubClient, getClient } = await import('./github');
      initGitHubClient('ghp_another_token');
      const client = getClient();
      expect(client).toBeDefined();
    });

    it('replaces existing client when called again', async () => {
      const { initGitHubClient, getClient } = await import('./github');
      initGitHubClient('ghp_token_1');
      const client1 = getClient();
      initGitHubClient('ghp_token_2');
      const client2 = getClient();
      expect(client1).toBeDefined();
      expect(client2).toBeDefined();
    });
  });
});
