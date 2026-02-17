import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  getPat,
  setPat,
  removePat,
} from '../utils/storage';

describe('storage utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  describe('setStorageItem / getStorageItem', () => {
    it('stores and retrieves a value', () => {
      setStorageItem('test-key', 'test-value');
      expect(getStorageItem('test-key')).toBe('test-value');
    });

    it('stores and retrieves objects', () => {
      const obj = { name: 'test', count: 42 };
      setStorageItem('obj-key', obj);
      expect(getStorageItem('obj-key')).toEqual(obj);
    });

    it('returns null for non-existent key', () => {
      expect(getStorageItem('no-such-key')).toBeNull();
    });

    it('returns null for expired items', () => {
      vi.useFakeTimers();
      setStorageItem('expire-key', 'value', 1); // 1ms TTL
      vi.advanceTimersByTime(2);
      expect(getStorageItem('expire-key')).toBeNull();
    });

    it('returns value for non-expired items', () => {
      setStorageItem('fresh-key', 'value', 60000); // 60s TTL
      expect(getStorageItem('fresh-key')).toBe('value');
    });
  });

  describe('removeStorageItem', () => {
    it('removes a stored item', () => {
      setStorageItem('remove-key', 'value');
      removeStorageItem('remove-key');
      expect(getStorageItem('remove-key')).toBeNull();
    });
  });

  describe('PAT helpers', () => {
    it('setPat stores and getPat retrieves', () => {
      setPat('ghp_test_token');
      expect(getPat()).toBe('ghp_test_token');
    });

    it('removePat clears the PAT', () => {
      setPat('ghp_test_token');
      removePat();
      expect(getPat()).toBeNull();
    });

    it('getPat returns null when no PAT is set', () => {
      expect(getPat()).toBeNull();
    });
  });
});
