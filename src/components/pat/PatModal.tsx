import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { Shield, Key, Eye, EyeOff } from 'lucide-react';

export function PatModal() {
  const { isAuthenticated, isValidating, error, setToken } = useAuthStore();
  const { demoMode } = useUIStore();
  const [token, setTokenValue] = useState('');
  const [showToken, setShowToken] = useState(false);

  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    await setToken(token.trim());
  };

  return (
    <Modal open={!isAuthenticated} closable={false} title="Connect to GitHub">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-brand-600/10 border border-brand-600/20">
          <Shield size={20} className="text-brand-400 mt-0.5 shrink-0" />
          <div className="text-sm text-gray-300">
            <p className="font-medium text-gray-200 mb-1">Personal Access Token required</p>
            <p>
              CodeAgentFlow needs a GitHub PAT to read/write epic specs and orchestrate tasks.
              Your token is stored <strong>locally in your browser only</strong> and never sent to any server.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-gray-400">
            <p className="font-medium text-gray-300 mb-1.5">Required scopes:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li><code className="text-xs bg-surface-3 px-1.5 py-0.5 rounded">repo</code> - Full repository access</li>
              <li><code className="text-xs bg-surface-3 px-1.5 py-0.5 rounded">workflow</code> - GitHub Actions (optional)</li>
            </ul>
          </div>

          <div className="relative">
            <Input
              id="pat-token"
              label="GitHub Personal Access Token"
              type={showToken && !demoMode ? 'text' : 'password'}
              value={demoMode ? 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' : token}
              onChange={e => setTokenValue(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              error={error ?? undefined}
              autoFocus
              disabled={demoMode}
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-[34px] text-gray-500 hover:text-gray-300 transition-colors"
              disabled={demoMode}
            >
              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <a
            href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=CodeAgentFlow"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1.5 transition-colors"
          >
            <Key size={14} />
            Create a new token
          </a>
          <Button type="submit" disabled={!token.trim() || isValidating}>
            {isValidating ? (
              <>
                <Spinner size="sm" />
                Validating...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
