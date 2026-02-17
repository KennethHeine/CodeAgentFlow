import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../auth';

// Mock the github service
vi.mock('@/services/github', () => ({
  validateToken: vi.fn(),
  initOctokit: vi.fn(),
  clearOctokit: vi.fn(),
}));

import { validateToken, initOctokit, clearOctokit } from '@/services/github';

const mockValidateToken = vi.mocked(validateToken);
const mockInitOctokit = vi.mocked(initOctokit);
const mockClearOctokit = vi.mocked(clearOctokit);

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useAuthStore.setState({
      token: null,
      login: null,
      isAuthenticated: false,
      isValidating: false,
      error: null,
    });
  });

  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.login).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isValidating).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setToken succeeds with valid token', async () => {
    mockValidateToken.mockResolvedValue({ valid: true, login: 'testuser' });

    const result = await useAuthStore.getState().setToken('ghp_valid');

    expect(result).toBe(true);
    expect(mockInitOctokit).toHaveBeenCalledWith('ghp_valid');
    expect(localStorage.getItem('caf:pat')).toBe('ghp_valid');
    expect(localStorage.getItem('caf:login')).toBe('testuser');

    const state = useAuthStore.getState();
    expect(state.token).toBe('ghp_valid');
    expect(state.login).toBe('testuser');
    expect(state.isAuthenticated).toBe(true);
    expect(state.isValidating).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setToken fails with invalid token', async () => {
    mockValidateToken.mockResolvedValue({ valid: false, error: 'Bad credentials' });

    const result = await useAuthStore.getState().setToken('ghp_invalid');

    expect(result).toBe(false);
    expect(localStorage.getItem('caf:pat')).toBeNull();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isValidating).toBe(false);
    expect(state.error).toBe('Bad credentials');
  });

  it('logout clears all state', async () => {
    // Set up authenticated state
    mockValidateToken.mockResolvedValue({ valid: true, login: 'testuser' });
    await useAuthStore.getState().setToken('ghp_valid');

    useAuthStore.getState().logout();

    expect(mockClearOctokit).toHaveBeenCalled();
    expect(localStorage.getItem('caf:pat')).toBeNull();
    expect(localStorage.getItem('caf:login')).toBeNull();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.login).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('restoreSession restores valid saved session', async () => {
    localStorage.setItem('caf:pat', 'ghp_saved');
    localStorage.setItem('caf:login', 'saveduser');
    mockValidateToken.mockResolvedValue({ valid: true, login: 'saveduser' });

    await useAuthStore.getState().restoreSession();

    expect(mockInitOctokit).toHaveBeenCalledWith('ghp_saved');
    const state = useAuthStore.getState();
    expect(state.token).toBe('ghp_saved');
    expect(state.login).toBe('saveduser');
    expect(state.isAuthenticated).toBe(true);
  });

  it('restoreSession logs out when token is revoked', async () => {
    localStorage.setItem('caf:pat', 'ghp_revoked');
    localStorage.setItem('caf:login', 'olduser');
    mockValidateToken.mockResolvedValue({ valid: false, error: 'Token revoked' });

    await useAuthStore.getState().restoreSession();

    expect(mockClearOctokit).toHaveBeenCalled();
    expect(localStorage.getItem('caf:pat')).toBeNull();
    expect(localStorage.getItem('caf:login')).toBeNull();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toContain('expired or been revoked');
  });

  it('restoreSession does nothing without saved credentials', async () => {
    await useAuthStore.getState().restoreSession();

    expect(mockInitOctokit).not.toHaveBeenCalled();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
  });
});
