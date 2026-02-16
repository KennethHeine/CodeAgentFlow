'use client';

import { useState } from 'react';
import { Nav } from '@/components/nav';
import { useGitHubConfig } from '@/lib/use-store';
import { createGitHubClient } from '@/lib/github';

export default function SettingsPage() {
  const [config, setConfig] = useGitHubConfig();
  const [token, setToken] = useState(config?.token ?? '');
  const [epicRepo, setEpicRepo] = useState(config?.epicRepo ?? '');
  const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim() || !epicRepo.trim()) return;

    setStatus('validating');
    setStatusMessage('Validating token…');

    try {
      const client = createGitHubClient(token.trim());
      const user = await client.validateToken();
      setStatusMessage(`Authenticated as ${user.login}`);

      // Verify epic repo access
      const [owner, repo] = epicRepo.trim().split('/');
      if (!owner || !repo) {
        setStatus('error');
        setStatusMessage('Epic repo must be in "owner/repo" format');
        return;
      }

      try {
        await client.getRepoContents(owner, repo, '');
      } catch {
        // Repo might be empty or epics dir doesn't exist yet - that's OK
      }

      setConfig({ token: token.trim(), epicRepo: epicRepo.trim() });
      setStatus('success');
      setStatusMessage(`Connected as ${user.login}. Epic repo: ${epicRepo.trim()}`);
    } catch (err) {
      setStatus('error');
      setStatusMessage(err instanceof Error ? err.message : 'Validation failed');
    }
  };

  const handleDisconnect = () => {
    setConfig({ token: '', epicRepo: '' });
    setToken('');
    setEpicRepo('');
    setStatus('idle');
    setStatusMessage('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Settings</h1>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="mb-4 text-lg font-semibold">GitHub Connection</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="token" className="mb-1 block text-sm font-medium">
                  Personal Access Token
                </label>
                <input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                  required
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Needs <code>repo</code> scope for full access.
                </p>
              </div>

              <div>
                <label htmlFor="epicRepo" className="mb-1 block text-sm font-medium">
                  Epic Repository
                </label>
                <input
                  id="epicRepo"
                  type="text"
                  value={epicRepo}
                  onChange={(e) => setEpicRepo(e.target.value)}
                  placeholder="owner/my-epics"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                  required
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Your private repo that stores epic specs as Markdown in <code>/epics/</code>.
                </p>
              </div>
            </div>
          </div>

          {status !== 'idle' && (
            <div
              className={`rounded-md p-3 text-sm ${
                status === 'success'
                  ? 'border border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
                  : status === 'error'
                    ? 'border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
                    : 'border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'
              }`}
            >
              {statusMessage}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={status === 'validating' || !token.trim() || !epicRepo.trim()}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {status === 'validating' ? 'Validating…' : 'Save & Connect'}
            </button>
            {config?.token && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                Disconnect
              </button>
            )}
          </div>
        </form>

        <div className="mt-8 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="mb-2 text-lg font-semibold">About</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            CodeAgentFlow v1 uses GitHub as its sole data store. Your PAT is stored
            in browser localStorage and never sent to any server other than
            api.github.com. All orchestration state is derived from GitHub Issues,
            PRs, labels, checks, and merges.
          </p>
        </div>
      </main>
    </div>
  );
}
