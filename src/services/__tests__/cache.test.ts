import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheService } from '../cache';

describe('CacheService', () => {
  let svc: CacheService;

  beforeEach(() => {
    localStorage.clear();
    svc = new CacheService('test');
  });

  it('stores and retrieves a value', () => {
    svc.set('key1', { foo: 'bar' });
    expect(svc.get('key1')).toEqual({ foo: 'bar' });
  });

  it('returns null for missing keys', () => {
    expect(svc.get('missing')).toBeNull();
  });

  it('respects TTL expiration', () => {
    vi.useFakeTimers();
    svc.set('key2', 'value', 1000); // 1 second TTL
    expect(svc.get('key2')).toBe('value');

    vi.advanceTimersByTime(1500);
    expect(svc.get('key2')).toBeNull();
    vi.useRealTimers();
  });

  it('removes a specific key', () => {
    svc.set('key3', 'value');
    svc.remove('key3');
    expect(svc.get('key3')).toBeNull();
  });

  it('clears all cached data with matching prefix', () => {
    svc.set('a', 1);
    svc.set('b', 2);
    localStorage.setItem('other:key', 'should-stay');

    svc.clearAll();

    expect(svc.get('a')).toBeNull();
    expect(svc.get('b')).toBeNull();
    expect(localStorage.getItem('other:key')).toBe('should-stay');
  });

  it('clears expired entries', () => {
    vi.useFakeTimers();
    svc.set('fresh', 'data', 10000);
    svc.set('stale', 'data', 100);

    vi.advanceTimersByTime(500);
    svc.clearExpired();

    expect(svc.get('fresh')).toBe('data');
    expect(svc.get('stale')).toBeNull();
    vi.useRealTimers();
  });

  it('handles corrupted cache entries gracefully', () => {
    localStorage.setItem('test:corrupt', 'not-json');
    expect(svc.get('corrupt')).toBeNull();
  });

  it('removes entries by prefix', () => {
    svc.set('file:abc:main', 'v1');
    svc.set('file:abc:dev', 'v2');
    svc.set('file:xyz:main', 'v3');

    svc.removeByPrefix('file:abc');

    expect(svc.get('file:abc:main')).toBeNull();
    expect(svc.get('file:abc:dev')).toBeNull();
    expect(svc.get('file:xyz:main')).toBe('v3');
  });

  it('logs warning when localStorage quota is exceeded', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const setItemOriginal = Storage.prototype.setItem;
    // Both the initial write and the retry after clearExpired must throw
    Storage.prototype.setItem = function () {
      throw new DOMException('QuotaExceededError');
    };

    svc.set('big-key', 'data');

    Storage.prototype.setItem = setItemOriginal;
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('localStorage quota exceeded'),
    );
    warnSpy.mockRestore();
  });

  it('uses prefix isolation', () => {
    const svc2 = new CacheService('other');
    svc.set('shared', 'from-test');
    svc2.set('shared', 'from-other');

    expect(svc.get('shared')).toBe('from-test');
    expect(svc2.get('shared')).toBe('from-other');
  });
});
