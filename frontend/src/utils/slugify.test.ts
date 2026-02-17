import { describe, it, expect } from 'vitest';
import { slugify, taskFilename, parseTaskIndex, parseTaskSlug } from '../utils/slugify';

describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  it('converts to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('hello@world!')).toBe('helloworld');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('hello---world')).toBe('hello-world');
  });

  it('trims leading/trailing hyphens', () => {
    expect(slugify('-hello-world-')).toBe('hello-world');
  });

  it('handles underscores', () => {
    expect(slugify('hello_world')).toBe('hello-world');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('handles complex strings', () => {
    expect(slugify('Migrate Authentication to OAuth2')).toBe('migrate-authentication-to-oauth2');
  });
});

describe('taskFilename', () => {
  it('creates zero-padded filename', () => {
    expect(taskFilename(0, 'setup-auth')).toBe('001-setup-auth.md');
  });

  it('pads to 3 digits', () => {
    expect(taskFilename(9, 'test')).toBe('010-test.md');
  });

  it('handles double digits', () => {
    expect(taskFilename(99, 'final')).toBe('100-final.md');
  });
});

describe('parseTaskIndex', () => {
  it('parses valid task filename', () => {
    expect(parseTaskIndex('001-setup-auth.md')).toBe(0);
  });

  it('parses higher index', () => {
    expect(parseTaskIndex('015-deploy.md')).toBe(14);
  });

  it('returns null for invalid format', () => {
    expect(parseTaskIndex('goal.md')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseTaskIndex('')).toBeNull();
  });
});

describe('parseTaskSlug', () => {
  it('extracts slug from filename', () => {
    expect(parseTaskSlug('001-setup-auth.md')).toBe('setup-auth');
  });

  it('handles longer slugs', () => {
    expect(parseTaskSlug('002-implement-oauth2-flow.md')).toBe('implement-oauth2-flow');
  });

  it('returns null for invalid format', () => {
    expect(parseTaskSlug('goal.md')).toBeNull();
  });
});
