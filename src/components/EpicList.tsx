import React, { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

interface EpicListItem {
  id: string;
  name: string;
}

export const EpicList: React.FC = () => {
  const { epicService, epicRepo, setEpicRepo } = useApp();
  const [epics, setEpics] = useState<EpicListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [repoInput, setRepoInput] = useState(epicRepo || '');
  const [isCreating, setIsCreating] = useState(false);
  const [newEpicName, setNewEpicName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (epicService) {
      loadEpics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epicService]);

  const loadEpics = async () => {
    if (!epicService) return;

    setIsLoading(true);
    try {
      const epicList = await epicService.listEpics();
      setEpics(epicList);
    } catch (error) {
      console.error('Failed to load epics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetRepo = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoInput.includes('/')) {
      setEpicRepo(repoInput);
    }
  };

  const handleCreateEpic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!epicService || !newEpicName.trim()) return;

    setIsCreating(true);
    try {
      const epicId = await epicService.createEpic(newEpicName);
      setNewEpicName('');
      await loadEpics();
      navigate(`/epic/${epicId}`);
    } catch (error) {
      console.error('Failed to create epic:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!epicRepo) {
    return (
      <div className="max-w-2xl mx-auto mt-20">
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Set Epic Repository</h2>
          <p className="text-gray-300 mb-6">
            Please specify your private GitHub repository where epics will be stored.
          </p>
          <form onSubmit={handleSetRepo} className="space-y-4">
            <div>
              <label htmlFor="repo" className="block text-sm font-medium mb-2">
                Repository (owner/repo)
              </label>
              <input
                id="repo"
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="username/my-epics-repo"
                className="input-field w-full"
                required
              />
              <p className="text-sm text-gray-400 mt-2">
                This repository should be private and dedicated to storing your CodeAgentFlow epics.
              </p>
            </div>
            <button type="submit" className="btn-primary">
              Set Repository
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Epics</h1>
          <p className="text-gray-400">
            Repository:{' '}
            <a
              href={`https://github.com/${epicRepo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-github-accent hover:underline"
            >
              {epicRepo}
            </a>
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="btn-primary"
        >
          + New Epic
        </button>
      </div>

      {isCreating && (
        <div className="card mb-6">
          <form onSubmit={handleCreateEpic} className="space-y-4">
            <div>
              <label htmlFor="epicName" className="block text-sm font-medium mb-2">
                Epic Name
              </label>
              <input
                id="epicName"
                type="text"
                value={newEpicName}
                onChange={(e) => setNewEpicName(e.target.value)}
                placeholder="My New Feature"
                className="input-field w-full"
                autoFocus
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={isCreating} className="btn-primary">
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewEpicName('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading epics...</div>
      ) : epics.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">No epics found. Create your first epic to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {epics.map((epic) => (
            <button
              key={epic.id}
              onClick={() => navigate(`/epic/${epic.id}`)}
              className="card text-left hover:border-github-accent transition-colors"
            >
              <h3 className="text-xl font-semibold">{epic.name}</h3>
              <p className="text-sm text-gray-400 mt-1">
                <a
                  href={`https://github.com/${epicRepo}/tree/main/epics/${epic.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-github-accent hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View in GitHub →
                </a>
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
