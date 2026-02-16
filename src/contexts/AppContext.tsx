import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GitHubClient } from '../services/github';
import { EpicService } from '../services/epic';
import { storage } from '../services/storage';

interface AppState {
  pat: string | null;
  epicRepo: string | null;
  github: GitHubClient | null;
  epicService: EpicService | null;
  user: { login: string } | null;
  isLoading: boolean;
}

interface AppContextValue extends AppState {
  setPAT: (token: string) => Promise<boolean>;
  setEpicRepo: (repo: string) => void;
  clearAuth: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    pat: null,
    epicRepo: null,
    github: null,
    epicService: null,
    user: null,
    isLoading: true,
  });

  // Initialize from storage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedPAT = storage.getPAT();
      const storedEpicRepo = storage.getEpicRepo();

      if (storedPAT) {
        const github = new GitHubClient(storedPAT);
        const validation = await github.validateToken();

        if (validation.valid) {
          const user = await github.getUser();

          let epicService: EpicService | null = null;
          if (storedEpicRepo) {
            const [owner, repo] = storedEpicRepo.split('/');
            epicService = new EpicService(github, owner, repo);
          }

          setState({
            pat: storedPAT,
            epicRepo: storedEpicRepo,
            github,
            epicService,
            user,
            isLoading: false,
          });
          return;
        } else {
          // Invalid token, clear it
          storage.removePAT();
        }
      }

      setState({
        pat: null,
        epicRepo: null,
        github: null,
        epicService: null,
        user: null,
        isLoading: false,
      });
    };

    initializeAuth();
  }, []);

  const setPAT = async (token: string): Promise<boolean> => {
    const github = new GitHubClient(token);
    const validation = await github.validateToken();

    if (!validation.valid) {
      return false;
    }

    const user = await github.getUser();
    storage.setPAT(token);

    const storedEpicRepo = storage.getEpicRepo();
    let epicService: EpicService | null = null;
    if (storedEpicRepo) {
      const [owner, repo] = storedEpicRepo.split('/');
      epicService = new EpicService(github, owner, repo);
    }

    setState({
      pat: token,
      epicRepo: storedEpicRepo,
      github,
      epicService,
      user,
      isLoading: false,
    });

    return true;
  };

  const setEpicRepo = (repo: string) => {
    storage.setEpicRepo(repo);

    let epicService: EpicService | null = null;
    if (state.github && repo) {
      const [owner, repoName] = repo.split('/');
      epicService = new EpicService(state.github, owner, repoName);
    }

    setState({
      ...state,
      epicRepo: repo,
      epicService,
    });
  };

  const clearAuth = () => {
    storage.clearAll();
    setState({
      pat: null,
      epicRepo: null,
      github: null,
      epicService: null,
      user: null,
      isLoading: false,
    });
  };

  return (
    <AppContext.Provider value={{ ...state, setPAT, setEpicRepo, clearAuth }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
