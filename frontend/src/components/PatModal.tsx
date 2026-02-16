import { useState } from 'react';
import { KeyRound, ExternalLink, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';

interface PatModalProps {
  onSubmit: (pat: string) => void;
  error: string | null;
  loading: boolean;
}

export function PatModal({ onSubmit, error, loading }: PatModalProps) {
  const [pat, setPat] = useState('');
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pat.trim()) {
      onSubmit(pat.trim());
    }
  };

  return (
    <div className="pat-modal-overlay" data-testid="pat-modal">
      <div className="pat-modal">
        <div className="pat-modal-header">
          <div className="pat-modal-icon">
            <KeyRound size={32} />
          </div>
          <h1>Welcome to CodeAgentFlow</h1>
          <p className="pat-modal-subtitle">
            Connect your GitHub account to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="pat-modal-form">
          <div className="pat-input-group">
            <label htmlFor="pat-input">GitHub Personal Access Token</label>
            <div className="pat-input-wrapper">
              <input
                id="pat-input"
                type={showToken ? 'text' : 'password'}
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                autoFocus
                disabled={loading}
                data-testid="pat-input"
              />
              <button
                type="button"
                className="pat-toggle-visibility"
                onClick={() => setShowToken(!showToken)}
                aria-label={showToken ? 'Hide token' : 'Show token'}
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="pat-error" data-testid="pat-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="pat-submit-btn"
            disabled={!pat.trim() || loading}
            data-testid="pat-submit"
          >
            {loading ? 'Verifying…' : 'Connect to GitHub'}
          </button>
        </form>

        <div className="pat-info-section">
          <div className="pat-info-card">
            <Shield size={16} />
            <div>
              <strong>Required scopes</strong>
              <p>repo, read:user</p>
            </div>
          </div>
          <div className="pat-info-card">
            <KeyRound size={16} />
            <div>
              <strong>Storage</strong>
              <p>Your token is stored locally in your browser only. It is never sent to any server other than GitHub's API.</p>
            </div>
          </div>
          <a
            href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=CodeAgentFlow"
            target="_blank"
            rel="noopener noreferrer"
            className="pat-create-link"
          >
            <ExternalLink size={14} />
            Create a new token on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
