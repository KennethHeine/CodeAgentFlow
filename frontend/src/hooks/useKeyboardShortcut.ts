import { useEffect, useCallback, useMemo } from 'react';

type KeyCombo = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
};

export function useKeyboardShortcut(combo: KeyCombo, callback: () => void) {
  const memoizedCombo = useMemo(
    () => combo,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [combo.key, combo.ctrl, combo.shift, combo.alt, combo.meta]
  );

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
        e.key.toLowerCase() === memoizedCombo.key.toLowerCase() &&
        !!e.ctrlKey === !!memoizedCombo.ctrl &&
        !!e.shiftKey === !!memoizedCombo.shift &&
        !!e.altKey === !!memoizedCombo.alt &&
        !!e.metaKey === !!memoizedCombo.meta
      ) {
        e.preventDefault();
        callback();
      }
    },
    [memoizedCombo, callback]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
