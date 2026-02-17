import { describe, it, expect } from 'vitest';
import {
  slugify,
  cn,
  padTaskNumber,
  parseTaskFilename,
  buildTaskFilename,
  splitRepoFullName,
  epicStatusLabel,
  taskStatusLabel,
  taskStatusColor,
  epicStatusColor,
  formatDate,
  formatRelativeTime,
} from '../utils';

describe('slugify', () => {
  it('converts text to lowercase kebab-case', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('Hello @World! #2')).toBe('hello-world-2');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  --hello--  ')).toBe('hello');
  });

  it('collapses multiple spaces and hyphens', () => {
    expect(slugify('hello    world---test')).toBe('hello-world-test');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });
});

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });

  it('returns empty string for no truthy values', () => {
    expect(cn(false, undefined)).toBe('');
  });
});

describe('padTaskNumber', () => {
  it('pads single digit', () => {
    expect(padTaskNumber(1)).toBe('001');
  });

  it('pads double digit', () => {
    expect(padTaskNumber(42)).toBe('042');
  });

  it('does not pad triple digit', () => {
    expect(padTaskNumber(100)).toBe('100');
  });
});

describe('parseTaskFilename', () => {
  it('parses standard task filename', () => {
    expect(parseTaskFilename('001-setup-auth.md')).toEqual({
      number: 1,
      slug: 'setup-auth',
    });
  });

  it('parses task with higher number', () => {
    expect(parseTaskFilename('042-refactor-api.md')).toEqual({
      number: 42,
      slug: 'refactor-api',
    });
  });

  it('returns null for non-matching filenames', () => {
    expect(parseTaskFilename('readme.md')).toBeNull();
    expect(parseTaskFilename('task-setup.md')).toBeNull();
    expect(parseTaskFilename('01-too-short.md')).toBeNull();
  });
});

describe('buildTaskFilename', () => {
  it('builds correct filename', () => {
    expect(buildTaskFilename(1, 'Setup Auth')).toBe('001-setup-auth.md');
  });

  it('builds filename with number 42', () => {
    expect(buildTaskFilename(42, 'Refactor API Layer')).toBe('042-refactor-api-layer.md');
  });
});

describe('splitRepoFullName', () => {
  it('splits owner/repo format', () => {
    expect(splitRepoFullName('octocat/hello-world')).toEqual({
      owner: 'octocat',
      repo: 'hello-world',
    });
  });

  it('returns null for invalid formats', () => {
    expect(splitRepoFullName('no-slash')).toBeNull();
    expect(splitRepoFullName('too/many/slashes')).toBeNull();
  });
});

describe('epicStatusLabel', () => {
  it('returns human-readable labels', () => {
    expect(epicStatusLabel('draft')).toBe('Draft');
    expect(epicStatusLabel('in_progress')).toBe('In Progress');
    expect(epicStatusLabel('completed')).toBe('Completed');
  });

  it('returns the status itself for unknown values', () => {
    expect(epicStatusLabel('unknown')).toBe('unknown');
  });
});

describe('taskStatusLabel', () => {
  it('returns human-readable labels', () => {
    expect(taskStatusLabel('pending')).toBe('Pending');
    expect(taskStatusLabel('agent_running')).toBe('Agent Running');
    expect(taskStatusLabel('pr_merged')).toBe('Merged');
  });
});

describe('taskStatusColor', () => {
  it('returns color classes for known statuses', () => {
    expect(taskStatusColor('pending')).toContain('text-gray-400');
    expect(taskStatusColor('pr_merged')).toContain('text-green-400');
    expect(taskStatusColor('failed')).toContain('text-red-400');
  });

  it('returns default for unknown status', () => {
    expect(taskStatusColor('xyz')).toContain('text-gray-400');
  });
});

describe('epicStatusColor', () => {
  it('returns color classes for known statuses', () => {
    expect(epicStatusColor('in_progress')).toContain('text-yellow-400');
    expect(epicStatusColor('completed')).toContain('text-green-400');
  });
});

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2026-01-15T12:00:00Z');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2026');
  });
});

describe('formatRelativeTime', () => {
  it('returns "just now" for very recent dates', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('returns minutes ago for recent dates', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
  });

  it('returns days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
    expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
  });
});
