import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../services/storage';

describe('Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('PAT storage', () => {
    it('should store and retrieve PAT', () => {
      const token = 'ghp_test123456789';
      storage.setPAT(token);
      expect(storage.getPAT()).toBe(token);
    });

    it('should remove PAT', () => {
      storage.setPAT('ghp_test123456789');
      storage.removePAT();
      expect(storage.getPAT()).toBeNull();
    });
  });

  describe('Epic repo storage', () => {
    it('should store and retrieve epic repo', () => {
      const repo = 'user/my-epics';
      storage.setEpicRepo(repo);
      expect(storage.getEpicRepo()).toBe(repo);
    });
  });

  describe('Cache with TTL', () => {
    it('should store and retrieve cache data', () => {
      const data = { test: 'value' };
      storage.setCache('test-key', data, 60000);
      expect(storage.getCache('test-key')).toEqual(data);
    });

    it('should return null for expired cache', () => {
      const data = { test: 'value' };
      storage.setCache('test-key', data, -1); // Already expired
      expect(storage.getCache('test-key')).toBeNull();
    });

    it('should return null for non-existent cache', () => {
      expect(storage.getCache('non-existent')).toBeNull();
    });

    it('should clear all cache', () => {
      storage.setCache('key1', 'value1', 60000);
      storage.setCache('key2', 'value2', 60000);
      storage.clearCache();
      expect(storage.getCache('key1')).toBeNull();
      expect(storage.getCache('key2')).toBeNull();
    });
  });

  describe('Last epic', () => {
    it('should store and retrieve last epic', () => {
      const epicId = 'my-epic-123';
      storage.setLastEpic(epicId);
      expect(storage.getLastEpic()).toBe(epicId);
    });
  });

  describe('clearAll', () => {
    it('should clear all stored data', () => {
      storage.setPAT('ghp_test123');
      storage.setEpicRepo('user/repo');
      storage.setLastEpic('epic-1');
      storage.setCache('key', 'value', 60000);

      storage.clearAll();

      expect(storage.getPAT()).toBeNull();
      expect(storage.getEpicRepo()).toBeNull();
      expect(storage.getLastEpic()).toBeNull();
      expect(storage.getCache('key')).toBeNull();
    });
  });
});
