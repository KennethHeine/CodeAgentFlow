import type { CacheEntry } from '@/types';

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export class CacheService {
  private prefix: string;

  constructor(prefix = 'caf') {
    this.prefix = prefix;
  }

  private key(k: string): string {
    return `${this.prefix}:${k}`;
  }

  get<T>(k: string): T | null {
    try {
      const raw = localStorage.getItem(this.key(k));
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      const age = Date.now() - entry.timestamp;

      if (age > entry.ttl) {
        localStorage.removeItem(this.key(k));
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  set<T>(k: string, data: T, ttl = DEFAULT_TTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    try {
      localStorage.setItem(this.key(k), JSON.stringify(entry));
    } catch {
      // Storage full - clear old entries
      this.clearExpired();
      try {
        localStorage.setItem(this.key(k), JSON.stringify(entry));
      } catch {
        // Still full, give up
      }
    }
  }

  remove(k: string): void {
    localStorage.removeItem(this.key(k));
  }

  clearAll(): void {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix + ':')) {
        keys.push(key);
      }
    }
    keys.forEach(k => localStorage.removeItem(k));
  }

  clearExpired(): void {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix + ':')) {
        keys.push(key);
      }
    }

    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const entry: CacheEntry<unknown> = JSON.parse(raw);
        if (Date.now() - entry.timestamp > entry.ttl) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  }
}

export const cache = new CacheService();
