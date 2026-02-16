import React, { useState } from 'react';

interface PATModalProps {
  isOpen: boolean;
  onSubmit: (token: string) => Promise<boolean>;
}

export const PATModal: React.FC<PATModalProps> = ({ isOpen, onSubmit }) => {
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const success = await onSubmit(token);

    if (!success) {
      setError('Invalid token or insufficient permissions. Please check your token and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-github-dark border border-github-border rounded-lg max-w-2xl w-full mx-4 p-6">
        <h2 className="text-2xl font-bold mb-4">GitHub Personal Access Token Required</h2>

        <div className="mb-6 space-y-3 text-gray-300">
          <p>
            CodeAgentFlow requires a GitHub Personal Access Token (PAT) to interact with your repositories.
          </p>

          <div className="bg-github-darker border border-github-border rounded p-4 space-y-2">
            <p className="font-semibold text-white">Required Scopes:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><code className="text-github-accent">repo</code> - Full control of private repositories</li>
              <li><code className="text-github-accent">workflow</code> - Update GitHub Actions workflows</li>
            </ul>
          </div>

          <p className="text-sm">
            <strong>Create a token:</strong>{' '}
            <a
              href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=CodeAgentFlow"
              target="_blank"
              rel="noopener noreferrer"
              className="text-github-accent hover:underline"
            >
              GitHub Settings → Developer settings → Personal access tokens
            </a>
          </p>

          <p className="text-sm text-gray-400">
            Your token is stored locally in your browser and never sent to any server other than GitHub's API.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium mb-2">
              Personal Access Token
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="input-field w-full font-mono text-sm"
              required
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-30 border border-red-800 rounded p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Validating...' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
