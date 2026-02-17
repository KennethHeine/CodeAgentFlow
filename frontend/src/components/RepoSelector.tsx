import { useState } from 'react';
import { X } from 'lucide-react';
import type { GitHubRepo } from '../types';

interface RepoSelectorProps {
  repos: GitHubRepo[];
  loading: boolean;
  onSelect: (repo: GitHubRepo) => void;
  onClose: () => void;
}

export function RepoSelector({ repos, loading, onSelect, onClose }: RepoSelectorProps) {
  const [filter, setFilter] = useState('');

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(filter.toLowerCase()) ||
      r.full_name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="modal-overlay" data-testid="repo-selector">
      <div className="modal">
        <div className="modal-header">
          <h2>Select Epic Repository</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <p className="modal-description">
          Choose the private repository where your epic Markdown files will be stored.
        </p>

        <input
          type="text"
          className="modal-search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter repositories…"
          autoFocus
          data-testid="repo-filter"
        />

        {loading ? (
          <p className="modal-loading">Loading repositories…</p>
        ) : (
          <ul className="repo-list">
            {filtered.map((repo) => (
              <li key={repo.full_name}>
                <button
                  className="repo-item"
                  onClick={() => onSelect(repo)}
                  data-testid={`repo-${repo.name}`}
                >
                  <span className="repo-name">{repo.full_name}</span>
                  {repo.private && <span className="repo-badge private">Private</span>}
                  {repo.description && (
                    <span className="repo-description">{repo.description}</span>
                  )}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="repo-empty">No repositories match your filter.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
