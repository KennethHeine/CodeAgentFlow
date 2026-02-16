import type { GitHubConfig } from './types';

const PREFIX = 'codeagentflow_';
const CHANGE_EVENT = 'codeagentflow_storage_change';

export interface StoreChangeDetail {
  key: string;
}

function emitChange(key: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<StoreChangeDetail>(CHANGE_EVENT, { detail: { key } }),
  );
}

export function onStoreChange(
  callback: (key: string) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<StoreChangeDetail>).detail;
    callback(detail.key);
  };
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

export const store = {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`${PREFIX}${key}`);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
      emitChange(key);
    } catch {
      // Storage full or unavailable — silently ignore
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${PREFIX}${key}`);
    emitChange(key);
  },

  /** Clears only keys with the codeagentflow_ prefix */
  clear(): void {
    if (typeof window === 'undefined') return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    emitChange('*');
  },

  getConfig(): GitHubConfig | null {
    return this.get<GitHubConfig>('config');
  },

  setConfig(config: GitHubConfig): void {
    this.set('config', config);
  },

  clearConfig(): void {
    this.remove('config');
  },
};
