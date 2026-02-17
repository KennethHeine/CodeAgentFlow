const STORAGE_PREFIX = 'codeagentflow:';

/**
 * Get a value from localStorage with optional TTL check.
 */
export function getStorageItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    const item = JSON.parse(raw);
    if (item.expiry && Date.now() > item.expiry) {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      return null;
    }
    return item.value as T;
  } catch {
    return null;
  }
}

/**
 * Set a value in localStorage with optional TTL (in milliseconds).
 */
export function setStorageItem<T>(key: string, value: T, ttlMs?: number): void {
  try {
    const item = {
      value,
      expiry: ttlMs ? Date.now() + ttlMs : null,
    };
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(item));
  } catch {
    // Storage may be full or disabled (e.g., Safari private mode)
  }
}

/**
 * Remove a value from localStorage.
 */
export function removeStorageItem(key: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
}

// PAT-specific helpers
const PAT_KEY = 'github-pat';

export function getPat(): string | null {
  return getStorageItem<string>(PAT_KEY);
}

export function setPat(pat: string): void {
  setStorageItem(PAT_KEY, pat);
}

export function removePat(): void {
  removeStorageItem(PAT_KEY);
}
