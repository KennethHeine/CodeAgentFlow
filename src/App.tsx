import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { PATModal } from './components/PATModal';
import { EpicList } from './components/EpicList';
import { EpicDetail } from './components/EpicDetail';

const AppContent: React.FC = () => {
  const { pat, user, isLoading, setPAT, clearAuth } = useApp();
  const [showPATModal, setShowPATModal] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !pat) {
      setShowPATModal(true);
    }
  }, [isLoading, pat]);

  const handlePATSubmit = async (token: string): Promise<boolean> => {
    const success = await setPAT(token);
    if (success) {
      setShowPATModal(false);
    }
    return success;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <PATModal isOpen={showPATModal} onSubmit={handlePATSubmit} />

      {pat && (
        <>
          {/* Header */}
          <header className="bg-github-darker border-b border-github-border">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold">
                  <a href="/" className="hover:text-github-accent transition-colors">
                    CodeAgentFlow
                  </a>
                </h1>
                <span className="text-sm text-gray-400">
                  Developer-first epic orchestration
                </span>
              </div>

              {user && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    Connected as{' '}
                    <a
                      href={`https://github.com/${user.login}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-github-accent hover:underline"
                    >
                      @{user.login}
                    </a>
                  </span>
                  <button
                    onClick={clearAuth}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="min-h-screen bg-github-darker">
            <Routes>
              <Route path="/" element={<EpicList />} />
              <Route path="/epic/:epicId" element={<EpicDetail />} />
            </Routes>
          </main>
        </>
      )}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
