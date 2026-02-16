import { useState, useEffect, useCallback } from 'react';
import { getPat, setPat, removePat } from '../utils/storage';
import { initGitHubClient, verifyPat } from '../services/github';
import type { GitHubUser } from '../types';

export function useAuth() {
  const [pat, setPatState] = useState<string | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      initGitHubClient(token);
      const userData = await verifyPat();
      setPat(token);
      setPatState(token);
      setUser(userData);
    } catch {
      setError('Invalid PAT or insufficient permissions. Please check your token.');
      removePat();
      setPatState(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    removePat();
    setPatState(null);
    setUser(null);
    setError(null);
  }, []);

  useEffect(() => {
    const stored = getPat();
    if (stored) {
      authenticate(stored);
    } else {
      setLoading(false);
    }
  }, [authenticate]);

  return {
    pat,
    user,
    loading,
    error,
    isAuthenticated: !!pat && !!user,
    authenticate,
    logout,
  };
}
