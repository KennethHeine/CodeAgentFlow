import { useState, useEffect } from 'react';
import { useEpicStore } from '@/stores/epic';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { listRepos } from '@/services/github';
import { cache } from '@/services/cache';
import { Spinner } from '@/components/ui/Spinner';
import type { GitHubRepo } from '@/types';
import {
  Settings as SettingsIcon,
  Database,
  Key,
  Trash2,
  RefreshCw,
  Check,
  FolderGit2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function Settings() {
  const { epicRepoFullName, setEpicRepo } = useEpicStore();
  const { login, logout } = useAuthStore();

  const [repoInput, setRepoInput] = useState(epicRepoFullName);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadRepos();
  }, []);

  const loadRepos = async () => {
    setLoadingRepos(true);
    try {
      const r = await listRepos();
      setRepos(r);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load repos');
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleSaveRepo = () => {
    if (!repoInput.includes('/')) {
      toast.error('Repository must be in owner/repo format');
      return;
    }
    setEpicRepo(repoInput);
    setSaved(true);
    toast.success('Epic repository saved');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearCache = () => {
    cache.clearAll();
    toast.success('Cache cleared');
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center">
          <SettingsIcon size={20} className="text-gray-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Settings</h1>
          <p className="text-gray-400 text-sm">Configure CodeAgentFlow</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Epic Repository */}
        <div className="bg-surface-1 border border-border-default rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <FolderGit2 size={16} className="text-brand-400" />
            <h2 className="font-semibold text-gray-200">Epic Repository</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Select the private repository where CodeAgentFlow stores epic specs (markdown files).
            The repo must already exist.
          </p>

          <div className="space-y-3">
            <Input
              id="epic-repo"
              label="Repository (owner/repo)"
              value={repoInput}
              onChange={e => setRepoInput(e.target.value)}
              placeholder="your-username/epic-specs"
            />

            {loadingRepos ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Spinner size="sm" />
                Loading repositories...
              </div>
            ) : repos.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Or select from your repos:</p>
                <div className="max-h-40 overflow-y-auto border border-border-muted rounded-lg">
                  {repos
                    .filter(r => r.private)
                    .slice(0, 20)
                    .map(r => (
                    <button
                      key={r.fullName}
                      onClick={() => setRepoInput(r.fullName)}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-surface-2 transition-colors ${
                        repoInput === r.fullName ? 'bg-brand-600/10 text-brand-300' : 'text-gray-300'
                      }`}
                    >
                      <Database size={12} className="text-gray-500 shrink-0" />
                      <span className="truncate">{r.fullName}</span>
                      {repoInput === r.fullName && <Check size={12} className="text-brand-400 ml-auto shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button onClick={handleSaveRepo} disabled={!repoInput.trim()}>
                {saved ? <><Check size={14} /> Saved</> : 'Save'}
              </Button>
              <Button variant="ghost" size="sm" onClick={loadRepos} disabled={loadingRepos}>
                <RefreshCw size={14} />
                Refresh repos
              </Button>
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="bg-surface-1 border border-border-default rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Key size={16} className="text-yellow-400" />
            <h2 className="font-semibold text-gray-200">Authentication</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Signed in as <strong className="text-gray-200">{login}</strong>.
            Your PAT is stored in browser localStorage.
          </p>
          <Button variant="danger" onClick={logout}>
            <Key size={14} />
            Disconnect &amp; clear token
          </Button>
        </div>

        {/* Cache */}
        <div className="bg-surface-1 border border-border-default rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 size={16} className="text-red-400" />
            <h2 className="font-semibold text-gray-200">Cache</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            CodeAgentFlow caches GitHub API responses locally (5 min TTL by default).
            Clear cache if you see stale data.
          </p>
          <Button variant="secondary" onClick={handleClearCache}>
            <Trash2 size={14} />
            Clear all cached data
          </Button>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="bg-surface-1 border border-border-default rounded-xl p-5">
          <h2 className="font-semibold text-gray-200 mb-4">Keyboard Shortcuts</h2>
          <div className="space-y-2">
            {[
              ['Ctrl+K / ?', 'Command palette'],
              ['Ctrl+B', 'Toggle sidebar'],
              ['G then D', 'Go to Dashboard'],
              ['G then E', 'Go to Epics'],
              ['G then S', 'Go to Settings'],
              ['N', 'New Epic'],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{desc}</span>
                <kbd>{key}</kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
