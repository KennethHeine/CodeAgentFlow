import { create } from 'zustand';
import { validateToken, initOctokit, clearOctokit } from '@/services/github';

interface AuthState {
  token: string | null;
  login: string | null;
  isAuthenticated: boolean;
  isValidating: boolean;
  error: string | null;
  setToken: (token: string) => Promise<boolean>;
  logout: () => void;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  login: null,
  isAuthenticated: false,
  isValidating: false,
  error: null,

  setToken: async (token: string) => {
    set({ isValidating: true, error: null });
    const result = await validateToken(token);

    if (result.valid) {
      localStorage.setItem('caf:pat', token);
      localStorage.setItem('caf:login', result.login!);
      initOctokit(token);
      set({
        token,
        login: result.login!,
        isAuthenticated: true,
        isValidating: false,
        error: null,
      });
      return true;
    } else {
      set({
        isValidating: false,
        error: result.error ?? 'Invalid token',
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('caf:pat');
    localStorage.removeItem('caf:login');
    clearOctokit();
    set({
      token: null,
      login: null,
      isAuthenticated: false,
      error: null,
    });
  },

  restoreSession: async () => {
    const token = localStorage.getItem('caf:pat');
    const login = localStorage.getItem('caf:login');

    if (token && login) {
      // Optimistically restore so the UI renders immediately
      initOctokit(token);
      set({ token, login, isAuthenticated: true });

      // Re-validate in the background; if the token was revoked, log out
      const result = await validateToken(token);
      if (!result.valid) {
        localStorage.removeItem('caf:pat');
        localStorage.removeItem('caf:login');
        clearOctokit();
        set({
          token: null,
          login: null,
          isAuthenticated: false,
          error: 'Your GitHub token has expired or been revoked. Please reconnect.',
        });
      }
    }
  },
}));
