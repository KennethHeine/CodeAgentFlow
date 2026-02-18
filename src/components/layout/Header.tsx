import { GitBranch, ExternalLink, LogOut, Settings, KeyRound } from 'lucide-react';
import type { GitHubUser } from '../../types';

interface HeaderProps {
  user: GitHubUser | null;
  epicRepo: string | null;
  onLogout: () => void;
  onSettingsClick: () => void;
  onSignIn?: () => void;
}

export function Header({ user, epicRepo, onLogout, onSettingsClick, onSignIn }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-logo">
          <GitBranch size={20} />
          <span className="header-title">CodeAgentFlow</span>
        </div>
        {epicRepo && (
          <div className="header-repo">
            <a
              href={`https://github.com/${epicRepo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="header-repo-link"
            >
              {epicRepo}
              <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>
      <div className="header-right">
        {user ? (
          <div className="header-user">
            <img src={user.avatar_url} alt={user.login} className="header-avatar" />
            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="header-username"
            >
              {user.login}
            </a>
            <button
              className="header-icon-btn"
              onClick={onSettingsClick}
              aria-label="Settings"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <button
              className="header-icon-btn"
              onClick={onLogout}
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            className="header-sign-in-btn"
            onClick={onSignIn}
            data-testid="header-sign-in"
          >
            <KeyRound size={14} />
            Sign in with GitHub
          </button>
        )}
      </div>
    </header>
  );
}
