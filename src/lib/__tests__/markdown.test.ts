import { describe, it, expect } from 'vitest';
import {
  generateGoalMarkdown,
  generateRequirementsMarkdown,
  generatePlanMarkdown,
  generateTaskMarkdown,
  parseTaskMarkdown,
  parseEpicPlanTasks,
} from '../markdown';

describe('generateGoalMarkdown', () => {
  it('generates markdown with epic name and goal', () => {
    const result = generateGoalMarkdown('Auth System', 'Implement secure login');
    expect(result).toContain('# Auth System - Goal');
    expect(result).toContain('Implement secure login');
  });
});

describe('generateRequirementsMarkdown', () => {
  it('generates markdown with epic name and requirements', () => {
    const result = generateRequirementsMarkdown('Auth System', 'Must support OAuth2');
    expect(result).toContain('# Auth System - Requirements');
    expect(result).toContain('Must support OAuth2');
  });
});

describe('generatePlanMarkdown', () => {
  it('generates markdown with epic name and plan', () => {
    const result = generatePlanMarkdown('Auth System', '1. Setup database\n2. Create API');
    expect(result).toContain('# Auth System - Plan');
    expect(result).toContain('1. Setup database');
  });
});

describe('generateTaskMarkdown', () => {
  it('generates markdown for task without subtasks', () => {
    const result = generateTaskMarkdown({
      title: 'Setup DB',
      content: 'Create the database schema',
      subtasks: [],
    });
    expect(result).toContain('# Setup DB');
    expect(result).toContain('Create the database schema');
    expect(result).not.toContain('## Subtasks');
  });

  it('generates markdown for task with subtasks', () => {
    const result = generateTaskMarkdown({
      title: 'Setup DB',
      content: 'Create the database schema',
      subtasks: [
        { id: '1', title: 'Research ORMs', type: 'research', description: 'Compare Prisma vs Drizzle', completed: false },
        { id: '2', title: 'Write migrations', type: 'work', description: '', completed: true },
      ],
    });
    expect(result).toContain('## Subtasks');
    expect(result).toContain('[ ] [Research] **Research ORMs**');
    expect(result).toContain('[x] [Work] **Write migrations**');
    expect(result).toContain('Compare Prisma vs Drizzle');
  });
});

describe('parseTaskMarkdown', () => {
  it('parses a simple task', () => {
    const md = `# Setup Database

Create the database schema and migrations.`;
    const result = parseTaskMarkdown(md);
    expect(result.title).toBe('Setup Database');
    expect(result.content).toBe('Create the database schema and migrations.');
    expect(result.subtasks).toHaveLength(0);
  });

  it('parses a task with subtasks', () => {
    const md = `# Setup Database

Create the database schema.

## Subtasks

- [ ] [Research] **Research ORMs**
  Compare Prisma vs Drizzle
- [x] [Work] **Write migrations**
  Run migration scripts`;
    const result = parseTaskMarkdown(md);
    expect(result.title).toBe('Setup Database');
    expect(result.content).toBe('Create the database schema.');
    expect(result.subtasks).toHaveLength(2);
    expect(result.subtasks[0]).toMatchObject({
      title: 'Research ORMs',
      type: 'research',
      completed: false,
      description: 'Compare Prisma vs Drizzle',
    });
    expect(result.subtasks[1]).toMatchObject({
      title: 'Write migrations',
      type: 'work',
      completed: true,
      description: 'Run migration scripts',
    });
  });

  it('handles empty content', () => {
    const md = `# Empty Task`;
    const result = parseTaskMarkdown(md);
    expect(result.title).toBe('Empty Task');
    expect(result.content).toBe('');
    expect(result.subtasks).toHaveLength(0);
  });
});

describe('parseEpicPlanTasks', () => {
  it('parses numbered tasks from a plan', () => {
    const plan = `# Plan

1. **Setup the database**
   Create PostgreSQL schema
2. **Build API endpoints**
   REST API for CRUD
3. **Create UI components**`;

    const tasks = parseEpicPlanTasks(plan);
    expect(tasks).toHaveLength(3);
    expect(tasks[0].title).toBe('Setup the database');
    expect(tasks[0].description).toBe('Create PostgreSQL schema');
    expect(tasks[1].title).toBe('Build API endpoints');
    expect(tasks[2].title).toBe('Create UI components');
    expect(tasks[2].description).toBe('');
  });

  it('returns empty array for no tasks', () => {
    const plan = 'Just some text without numbered tasks.';
    const tasks = parseEpicPlanTasks(plan);
    expect(tasks).toHaveLength(0);
  });
});
