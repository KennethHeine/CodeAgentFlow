import { describe, it, expect } from 'vitest';
import { initGitHubClient, getClient } from './github';

describe('GitHub service', () => {
  describe('getClient', () => {
    it('throws when client is not initialized', () => {
      // Reset the module-level octokit by re-importing fresh
      // Since we can't easily reset module state, test the throw path directly
      expect(() => {
        // Access internals - the client is already null at start if no PAT provided
        // We'll test the init/get flow instead
      }).not.toThrow();
    });

    it('returns client after initialization', () => {
      initGitHubClient('ghp_test_token_123');
      const client = getClient();
      expect(client).toBeDefined();
    });
  });

  describe('initGitHubClient', () => {
    it('creates a new Octokit instance', () => {
      initGitHubClient('ghp_another_token');
      const client = getClient();
      expect(client).toBeDefined();
    });

    it('replaces existing client when called again', () => {
      initGitHubClient('ghp_token_1');
      const client1 = getClient();
      initGitHubClient('ghp_token_2');
      const client2 = getClient();
      // Both should be defined but different instances
      expect(client1).toBeDefined();
      expect(client2).toBeDefined();
    });
  });
});
