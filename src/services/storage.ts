/**
 * Browser storage service for local-only data (PAT, cache, UI state)
 */

const STORAGE_KEYS = {
  GITHUB_PAT: 'codeagentflow_github_pat',
  EPIC_REPO: 'codeagentflow_epic_repo',
  LAST_EPIC: 'codeagentflow_last_epic',
  CACHE_PREFIX: 'codeagentflow_cache_',
} as const;

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

export const storage = {
  // PAT storage
  getPAT(): string | null {
    return localStorage.getItem(STORAGE_KEYS.GITHUB_PAT);
  },

  setPAT(token: string): void {
    localStorage.setItem(STORAGE_KEYS.GITHUB_PAT, token);
  },

  removePAT(): void {
    localStorage.removeItem(STORAGE_KEYS.GITHUB_PAT);
  },

  // Epic repo storage
  getEpicRepo(): string | null {
    return localStorage.getItem(STORAGE_KEYS.EPIC_REPO);
  },

  setEpicRepo(repo: string): void {
    localStorage.setItem(STORAGE_KEYS.EPIC_REPO, repo);
  },

  // Last viewed epic
  getLastEpic(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_EPIC);
  },

  setLastEpic(epicId: string): void {
    localStorage.setItem(STORAGE_KEYS.LAST_EPIC, epicId);
  },

  // Cache with TTL
  setCache<T>(key: string, data: T, ttl: number = 300000): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(STORAGE_KEYS.CACHE_PREFIX + key, JSON.stringify(entry));
  },

  getCache<T>(key: string): T | null {
    const item = localStorage.getItem(STORAGE_KEYS.CACHE_PREFIX + key);
    if (!item) return null;

    try {
      const entry: CacheEntry<T> = JSON.parse(item);
      const age = Date.now() - entry.timestamp;

      if (age > entry.ttl) {
        localStorage.removeItem(STORAGE_KEYS.CACHE_PREFIX + key);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  },

  clearCache(): void {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_KEYS.CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  },

  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      if (key !== STORAGE_KEYS.CACHE_PREFIX) {
        localStorage.removeItem(key);
      }
    });
    this.clearCache();
  },
};
