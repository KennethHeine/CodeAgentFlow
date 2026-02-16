import { useEffect, useCallback } from 'react';

type KeyCombo = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
};

export function useKeyboardShortcut(combo: KeyCombo, callback: () => void) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Don't trigger in input/textarea/contenteditable
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (
        e.key.toLowerCase() === combo.key.toLowerCase() &&
        !!e.ctrlKey === !!combo.ctrl &&
        !!e.shiftKey === !!combo.shift &&
        !!e.altKey === !!combo.alt &&
        !!e.metaKey === !!combo.meta
      ) {
        e.preventDefault();
        callback();
      }
    },
    [combo, callback]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
