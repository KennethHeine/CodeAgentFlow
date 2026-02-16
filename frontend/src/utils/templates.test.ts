import { describe, it, expect } from 'vitest';
import {
  renderGoalMd,
  renderRequirementsMd,
  renderPlanMd,
  renderTaskMd,
  parseTaskMd,
  deriveTaskStatus,
} from '../utils/templates';

describe('renderGoalMd', () => {
  it('renders goal markdown', () => {
    const result = renderGoalMd('My Epic', 'Build a great feature');
    expect(result).toBe('# My Epic — Goal\n\nBuild a great feature\n');
  });
});

describe('renderRequirementsMd', () => {
  it('renders requirements markdown', () => {
    const result = renderRequirementsMd('My Epic', 'Must be fast');
    expect(result).toBe('# My Epic — Requirements\n\nMust be fast\n');
  });
});

describe('renderPlanMd', () => {
  it('renders plan with tasks', () => {
    const tasks = [
      { title: 'Setup', slug: 'setup', subtasks: [{ title: 'Research', type: 'research' as const, description: '' }] },
      { title: 'Build', slug: 'build', subtasks: [] },
    ];
    const result = renderPlanMd('My Epic', 'High level plan', tasks);
    expect(result).toContain('# My Epic — Plan');
    expect(result).toContain('High level plan');
    expect(result).toContain('1. **Setup**');
    expect(result).toContain('   - [research] Research');
    expect(result).toContain('2. **Build**');
  });

  it('renders plan without tasks', () => {
    const result = renderPlanMd('My Epic', 'Just a plan', []);
    expect(result).toContain('## Tasks');
  });
});

describe('renderTaskMd', () => {
  it('renders task markdown', () => {
    const task = {
      title: 'Setup Auth',
      slug: 'setup-auth',
      subtasks: [
        { title: 'Research OAuth', type: 'research' as const, description: 'Look into OAuth2' },
        { title: 'Implement', type: 'work' as const, description: 'Code it up' },
      ],
    };
    const result = renderTaskMd(task, 0);
    expect(result).toContain('# Task 001: Setup Auth');
    expect(result).toContain('## Subtasks');
    expect(result).toContain('### 1. [research] Research OAuth');
    expect(result).toContain('Look into OAuth2');
    expect(result).toContain('### 2. [work] Implement');
    expect(result).toContain('Code it up');
  });

  it('renders task without subtasks', () => {
    const task = { title: 'Simple Task', slug: 'simple', subtasks: [] };
    const result = renderTaskMd(task, 2);
    expect(result).toContain('# Task 003: Simple Task');
    expect(result).not.toContain('## Subtasks');
  });
});

describe('parseTaskMd', () => {
  it('parses task title', () => {
    const content = '# Task 001: Setup Auth\n\nSome content';
    const result = parseTaskMd(content, '001-setup-auth.md');
    expect(result.title).toBe('Setup Auth');
  });

  it('falls back to filename for title', () => {
    const content = 'No heading here';
    const result = parseTaskMd(content, '001-setup-auth.md');
    expect(result.title).toBe('001-setup-auth.md');
  });
});

describe('deriveTaskStatus', () => {
  it('returns done when PR is merged', () => {
    expect(deriveTaskStatus({ prMerged: true, prNumber: 1 })).toBe('done');
  });

  it('returns review when PR is open', () => {
    expect(deriveTaskStatus({ prNumber: 1, prState: 'open' })).toBe('review');
  });

  it('returns in-progress when issue exists', () => {
    expect(deriveTaskStatus({ issueNumber: 1 })).toBe('in-progress');
  });

  it('returns pending when nothing exists', () => {
    expect(deriveTaskStatus({})).toBe('pending');
  });
});
