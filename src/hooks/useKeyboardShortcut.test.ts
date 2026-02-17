import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcut } from './useKeyboardShortcut';

describe('useKeyboardShortcut', () => {
  it('calls callback when matching key combo is pressed', () => {
    const callback = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'n' }, callback));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not call callback for non-matching keys', () => {
    const callback = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'n' }, callback));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
    expect(callback).not.toHaveBeenCalled();
  });

  it('matches modifier keys correctly', () => {
    const callback = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'k', ctrl: true }, callback));

    // Without ctrl - should not fire
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    expect(callback).not.toHaveBeenCalled();

    // With ctrl - should fire
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not fire when target is an input element', () => {
    const callback = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'n' }, callback));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }));
    document.body.removeChild(input);

    expect(callback).not.toHaveBeenCalled();
  });

  it('does not fire when target is a textarea element', () => {
    const callback = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'n' }, callback));

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }));
    document.body.removeChild(textarea);

    expect(callback).not.toHaveBeenCalled();
  });

  it('is case-insensitive for key matching', () => {
    const callback = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'N' }, callback));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('cleans up event listener on unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut({ key: 'n' }, callback));

    unmount();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
    expect(callback).not.toHaveBeenCalled();
  });

  it('handles shift modifier', () => {
    const callback = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'd', ctrl: true, shift: true }, callback));

    // Without shift - should not fire
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true }));
    expect(callback).not.toHaveBeenCalled();

    // With ctrl+shift - should fire
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true, shiftKey: true }));
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
