import { useState, useCallback } from 'react';
import { PatModal, Header, Sidebar, EpicWizard, EpicDetail, RepoSelector } from './components';
import { useAuth, useEpics, useKeyboardShortcut } from './hooks';
import { listRepos } from './services/github';
import { getStorageItem, setStorageItem } from './utils/storage';
import type { GitHubRepo, Epic, EpicCreationState } from './types';
import './App.css';

function App() {
  const { user, loading: authLoading, error: authError, isAuthenticated, authenticate, logout } = useAuth();

  // Epic repo state
  const [epicRepo, setEpicRepo] = useState<{ owner: string; name: string; full_name: string } | null>(() => {
    const saved = getStorageItem<{ owner: string; name: string; full_name: string }>('epic-repo');
    return saved;
  });

  // UI state
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [selectedEpicSlug, setSelectedEpicSlug] = useState<string | null>(null);
  const [epicDetail, setEpicDetail] = useState<Epic | null>(null);
  const [epicDetailLoading, setEpicDetailLoading] = useState(false);

  // Epic management
  const {
    epics,
    loading: epicsLoading,
    createEpic,
    loadEpicDetails,
    loadEpics,
  } = useEpics(epicRepo?.owner ?? null, epicRepo?.name ?? null);

  // Keyboard shortcuts
  useKeyboardShortcut({ key: 'n' }, () => {
    if (isAuthenticated && epicRepo) {
      setShowWizard(true);
    }
  });

  const handleSelectRepo = useCallback((repo: GitHubRepo) => {
    const parts = repo.full_name.split('/');
    const repoInfo = { owner: parts[0], name: parts[1], full_name: repo.full_name };
    setEpicRepo(repoInfo);
    setStorageItem('epic-repo', repoInfo);
    setShowRepoSelector(false);
  }, []);

  const handleOpenRepoSelector = useCallback(async () => {
    setShowRepoSelector(true);
    setReposLoading(true);
    try {
      const repoList = await listRepos();
      setRepos(repoList);
    } catch {
      setRepos([]);
    } finally {
      setReposLoading(false);
    }
  }, []);

  const handleSelectEpic = useCallback(async (slug: string) => {
    setSelectedEpicSlug(slug);
    setEpicDetailLoading(true);
    try {
      const detail = await loadEpicDetails(slug);
      setEpicDetail(detail);
    } catch {
      setEpicDetail(null);
    } finally {
      setEpicDetailLoading(false);
    }
  }, [loadEpicDetails]);

  const handleRefreshEpic = useCallback(async () => {
    if (selectedEpicSlug) {
      handleSelectEpic(selectedEpicSlug);
    }
  }, [selectedEpicSlug, handleSelectEpic]);

  const handleCreateEpic = useCallback(async (state: EpicCreationState) => {
    const slug = await createEpic(state);
    setShowWizard(false);
    await loadEpics();
    handleSelectEpic(slug);
  }, [createEpic, loadEpics, handleSelectEpic]);

  // PAT gate
  if (!isAuthenticated) {
    return <PatModal onSubmit={authenticate} error={authError} loading={authLoading} />;
  }

  // Repo selection gate
  if (!epicRepo) {
    return (
      <div className="app-container">
        <Header
          user={user}
          epicRepo={null}
          onLogout={logout}
          onSettingsClick={handleOpenRepoSelector}
        />
        <div className="repo-selection-prompt">
          <h2>Select your Epic Repository</h2>
          <p>Choose the repository where your epic Markdown files will be stored.</p>
          <button className="primary-btn" onClick={handleOpenRepoSelector} data-testid="select-repo-btn">
            Select Repository
          </button>
          {showRepoSelector && (
            <RepoSelector
              repos={repos}
              loading={reposLoading}
              onSelect={handleSelectRepo}
              onClose={() => setShowRepoSelector(false)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header
        user={user}
        epicRepo={epicRepo.full_name}
        onLogout={logout}
        onSettingsClick={handleOpenRepoSelector}
      />
      <div className="app-body">
        <Sidebar
          epics={epics}
          selectedEpic={selectedEpicSlug}
          onSelectEpic={handleSelectEpic}
          onCreateEpic={() => setShowWizard(true)}
        />
        <main className="app-main">
          <EpicDetail
            epic={epicDetail}
            loading={epicDetailLoading || epicsLoading}
            epicRepo={epicRepo.full_name}
            onRefresh={handleRefreshEpic}
          />
        </main>
      </div>

      {showWizard && (
        <EpicWizard
          onComplete={handleCreateEpic}
          onCancel={() => setShowWizard(false)}
          saving={epicsLoading}
        />
      )}

      {showRepoSelector && (
        <RepoSelector
          repos={repos}
          loading={reposLoading}
          onSelect={handleSelectRepo}
          onClose={() => setShowRepoSelector(false)}
        />
      )}
    </div>
  );
}

export default App;
