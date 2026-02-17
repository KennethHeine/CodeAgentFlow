import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../ui';

describe('useUIStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useUIStore.setState({
      sidebarOpen: true,
      commandPaletteOpen: false,
    });
  });

  it('has sidebar open by default', () => {
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('has command palette closed by default', () => {
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });

  it('toggles sidebar', () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);

    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('sets sidebar open state directly', () => {
    useUIStore.getState().setSidebarOpen(false);
    expect(useUIStore.getState().sidebarOpen).toBe(false);

    useUIStore.getState().setSidebarOpen(true);
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('toggles command palette', () => {
    useUIStore.getState().toggleCommandPalette();
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);

    useUIStore.getState().toggleCommandPalette();
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });

  it('sets command palette open state directly', () => {
    useUIStore.getState().setCommandPaletteOpen(true);
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);

    useUIStore.getState().setCommandPaletteOpen(false);
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });
});
