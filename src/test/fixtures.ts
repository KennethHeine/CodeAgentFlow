/**
 * Shared test fixtures and factory functions.
 *
 * Use these helpers in tests to create consistent mock data without
 * duplicating object literals across test files.
 */

import type { Epic, Task, Subtask, TaskDraft, SubtaskDraft, EpicCreationState } from '../types';

/**
 * Create a mock Subtask with sensible defaults.
 */
export function createSubtask(overrides: Partial<Subtask> = {}): Subtask {
  return {
    title: 'Research OAuth',
    type: 'research',
    description: 'Look into OAuth2 flows',
    completed: false,
    ...overrides,
  };
}

/**
 * Create a mock Task with sensible defaults.
 */
export function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: '001-setup-auth.md',
    slug: 'setup-auth',
    title: 'Setup Auth',
    filename: '001-setup-auth.md',
    content: '# Task 001: Setup Auth',
    subtasks: [],
    status: 'pending',
    ...overrides,
  };
}

/**
 * Create a mock Epic with sensible defaults.
 */
export function createEpic(overrides: Partial<Epic> = {}): Epic {
  return {
    name: 'migrate-auth',
    slug: 'migrate-auth',
    path: 'epics/migrate-auth',
    tasks: [],
    ...overrides,
  };
}

/**
 * Create a mock SubtaskDraft with sensible defaults.
 */
export function createSubtaskDraft(overrides: Partial<SubtaskDraft> = {}): SubtaskDraft {
  return {
    title: 'Research OAuth',
    type: 'research',
    description: 'Look into OAuth2',
    ...overrides,
  };
}

/**
 * Create a mock TaskDraft with sensible defaults.
 */
export function createTaskDraft(overrides: Partial<TaskDraft> = {}): TaskDraft {
  return {
    title: 'Setup Auth',
    slug: 'setup-auth',
    subtasks: [],
    ...overrides,
  };
}

/**
 * Create a mock EpicCreationState with sensible defaults.
 */
export function createEpicCreationState(overrides: Partial<EpicCreationState> = {}): EpicCreationState {
  return {
    step: 'name',
    name: 'My Epic',
    goal: 'Build a great feature',
    requirements: 'Must be fast',
    plan: 'High level plan',
    tasks: [],
    ...overrides,
  };
}
