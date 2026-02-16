import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatModal } from '../components/PatModal';

describe('PatModal', () => {
  it('renders the modal', () => {
    render(<PatModal onSubmit={vi.fn()} error={null} loading={false} />);
    expect(screen.getByTestId('pat-modal')).toBeInTheDocument();
    expect(screen.getByText('Welcome to CodeAgentFlow')).toBeInTheDocument();
  });

  it('renders the PAT input', () => {
    render(<PatModal onSubmit={vi.fn()} error={null} loading={false} />);
    expect(screen.getByTestId('pat-input')).toBeInTheDocument();
  });

  it('shows required scopes info', () => {
    render(<PatModal onSubmit={vi.fn()} error={null} loading={false} />);
    expect(screen.getByText('repo, read:user')).toBeInTheDocument();
  });

  it('shows storage info', () => {
    render(<PatModal onSubmit={vi.fn()} error={null} loading={false} />);
    expect(
      screen.getByText(/stored locally in your browser only/)
    ).toBeInTheDocument();
  });

  it('submit button is disabled when input is empty', () => {
    render(<PatModal onSubmit={vi.fn()} error={null} loading={false} />);
    expect(screen.getByTestId('pat-submit')).toBeDisabled();
  });

  it('submit button is enabled when input has value', async () => {
    const user = userEvent.setup();
    render(<PatModal onSubmit={vi.fn()} error={null} loading={false} />);
    await user.type(screen.getByTestId('pat-input'), 'ghp_test');
    expect(screen.getByTestId('pat-submit')).toBeEnabled();
  });

  it('calls onSubmit with PAT when form is submitted', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PatModal onSubmit={onSubmit} error={null} loading={false} />);
    await user.type(screen.getByTestId('pat-input'), 'ghp_test_token');
    await user.click(screen.getByTestId('pat-submit'));
    expect(onSubmit).toHaveBeenCalledWith('ghp_test_token');
  });

  it('shows error message when error prop is set', () => {
    render(<PatModal onSubmit={vi.fn()} error="Invalid token" loading={false} />);
    expect(screen.getByTestId('pat-error')).toBeInTheDocument();
    expect(screen.getByText('Invalid token')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<PatModal onSubmit={vi.fn()} error={null} loading={true} />);
    expect(screen.getByText('Verifying…')).toBeInTheDocument();
  });

  it('toggles token visibility', async () => {
    const user = userEvent.setup();
    render(<PatModal onSubmit={vi.fn()} error={null} loading={false} />);
    const input = screen.getByTestId('pat-input');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByLabelText('Show token'));
    expect(input).toHaveAttribute('type', 'text');

    await user.click(screen.getByLabelText('Hide token'));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('has a link to create new token on GitHub', () => {
    render(<PatModal onSubmit={vi.fn()} error={null} loading={false} />);
    const link = screen.getByText('Create a new token on GitHub');
    expect(link).toHaveAttribute('href', expect.stringContaining('github.com/settings/tokens'));
  });
});
