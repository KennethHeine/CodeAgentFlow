import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RepoSelector } from './RepoSelector';
import type { GitHubRepo } from '../../types';

const mockRepos: GitHubRepo[] = [
  {
    name: 'my-app',
    full_name: 'user/my-app',
    html_url: 'https://github.com/user/my-app',
    description: 'A cool application',
    private: false,
    default_branch: 'main',
  },
  {
    name: 'secret-project',
    full_name: 'user/secret-project',
    html_url: 'https://github.com/user/secret-project',
    description: null,
    private: true,
    default_branch: 'main',
  },
];

describe('RepoSelector', () => {
  const defaultProps = {
    repos: mockRepos,
    loading: false,
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders the repo selector modal', () => {
    render(<RepoSelector {...defaultProps} />);
    expect(screen.getByTestId('repo-selector')).toBeInTheDocument();
    expect(screen.getByText('Select Epic Repository')).toBeInTheDocument();
  });

  it('shows all repos', () => {
    render(<RepoSelector {...defaultProps} />);
    expect(screen.getByText('user/my-app')).toBeInTheDocument();
    expect(screen.getByText('user/secret-project')).toBeInTheDocument();
  });

  it('shows private badge for private repos', () => {
    render(<RepoSelector {...defaultProps} />);
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('shows repo description when available', () => {
    render(<RepoSelector {...defaultProps} />);
    expect(screen.getByText('A cool application')).toBeInTheDocument();
  });

  it('filters repos by name', async () => {
    const user = userEvent.setup();
    render(<RepoSelector {...defaultProps} />);

    await user.type(screen.getByTestId('repo-filter'), 'secret');
    expect(screen.queryByText('user/my-app')).not.toBeInTheDocument();
    expect(screen.getByText('user/secret-project')).toBeInTheDocument();
  });

  it('shows empty message when filter matches nothing', async () => {
    const user = userEvent.setup();
    render(<RepoSelector {...defaultProps} />);

    await user.type(screen.getByTestId('repo-filter'), 'nonexistent');
    expect(screen.getByText('No repositories match your filter.')).toBeInTheDocument();
  });

  it('calls onSelect when a repo is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<RepoSelector {...defaultProps} onSelect={onSelect} />);

    await user.click(screen.getByTestId('repo-my-app'));
    expect(onSelect).toHaveBeenCalledWith(mockRepos[0]);
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<RepoSelector {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByLabelText('Close modal'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<RepoSelector {...defaultProps} loading={true} />);
    expect(screen.getByText('Loading repositories…')).toBeInTheDocument();
  });
});
