'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { store, onStoreChange } from './store';
import type { GitHubConfig } from './types';

/**
 * React hook for reactive localStorage access.
 * Uses useSyncExternalStore for proper concurrent-mode support.
 */
export function useStore<T>(
  key: string,
): [T | null, (value: T) => void, () => void] {
  const subscribe = useCallback(
    (onStoreChangeCallback: () => void) => {
      return onStoreChange((changedKey) => {
        if (changedKey === key || changedKey === '*') {
          onStoreChangeCallback();
        }
      });
    },
    [key],
  );

  const getSnapshot = useCallback(() => {
    return store.get<T>(key);
  }, [key]);

  const getServerSnapshot = useCallback((): T | null => {
    return null;
  }, []);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (v: T) => store.set(key, v),
    [key],
  );

  const removeValue = useCallback(
    () => store.remove(key),
    [key],
  );

  return [value, setValue, removeValue];
}

/** Convenience hook for the GitHub config */
export function useGitHubConfig(): [
  GitHubConfig | null,
  (config: GitHubConfig) => void,
] {
  const [config, setConfig] = useStore<GitHubConfig>('config');
  return [config, setConfig];
}
