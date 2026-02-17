import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EpicDetail } from './EpicDetail';
import { createEpic, createTask } from '../../test/fixtures';

describe('EpicDetail', () => {
  const defaultProps = {
    epic: null as ReturnType<typeof createEpic> | null,
    loading: false,
    epicRepo: 'owner/repo',
    onRefresh: vi.fn(),
  };

  it('shows empty state when no epic is selected', () => {
    render(<EpicDetail {...defaultProps} />);
    expect(screen.getByTestId('epic-detail-empty')).toBeInTheDocument();
    expect(screen.getByText('Select an epic')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<EpicDetail {...defaultProps} loading={true} />);
    expect(screen.getByText('Loading epic…')).toBeInTheDocument();
  });

  it('renders epic name', () => {
    const epic = createEpic({ name: 'My Auth Epic' });
    render(<EpicDetail {...defaultProps} epic={epic} />);
    expect(screen.getByText('My Auth Epic')).toBeInTheDocument();
  });

  it('shows overview tab by default with task stats', () => {
    const epic = createEpic({
      tasks: [
        createTask({ status: 'done' }),
        createTask({ id: '002', status: 'in-progress' }),
        createTask({ id: '003', status: 'pending' }),
      ],
    });
    render(<EpicDetail {...defaultProps} epic={epic} />);
    expect(screen.getByText('3')).toBeInTheDocument(); // Total tasks
  });

  it('switches to goal tab', async () => {
    const user = userEvent.setup();
    const epic = createEpic({ goal: '# Goal content here' });
    render(<EpicDetail {...defaultProps} epic={epic} />);

    await user.click(screen.getByTestId('tab-goal'));
    expect(screen.getByText('# Goal content here')).toBeInTheDocument();
  });

  it('switches to requirements tab', async () => {
    const user = userEvent.setup();
    const epic = createEpic({ requirements: 'Must be fast and secure' });
    render(<EpicDetail {...defaultProps} epic={epic} />);

    await user.click(screen.getByTestId('tab-requirements'));
    expect(screen.getByText('Must be fast and secure')).toBeInTheDocument();
  });

  it('shows GitHub link when epicRepo is provided', () => {
    const epic = createEpic({ slug: 'my-epic' });
    render(<EpicDetail {...defaultProps} epic={epic} epicRepo="owner/repo" />);
    const link = screen.getByText('View on GitHub');
    expect(link).toHaveAttribute('href', 'https://github.com/owner/repo/tree/main/epics/my-epic');
  });

  it('calls onRefresh when refresh button is clicked', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    const epic = createEpic();
    render(<EpicDetail {...defaultProps} epic={epic} onRefresh={onRefresh} />);

    await user.click(screen.getByTitle('Refresh'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows tasks tab with task list', async () => {
    const user = userEvent.setup();
    const epic = createEpic({
      tasks: [
        createTask({ title: 'Setup Auth', status: 'done' }),
        createTask({ id: '002', title: 'Implement OAuth', status: 'review', prNumber: 42 }),
      ],
    });
    render(<EpicDetail {...defaultProps} epic={epic} />);

    await user.click(screen.getByTestId('tab-tasks'));
    expect(screen.getByText('Setup Auth')).toBeInTheDocument();
    expect(screen.getByText('Implement OAuth')).toBeInTheDocument();
  });

  it('shows empty tasks message when no tasks', async () => {
    const user = userEvent.setup();
    const epic = createEpic({ tasks: [] });
    render(<EpicDetail {...defaultProps} epic={epic} />);

    await user.click(screen.getByTestId('tab-tasks'));
    expect(screen.getByText('No tasks defined yet.')).toBeInTheDocument();
  });
});
