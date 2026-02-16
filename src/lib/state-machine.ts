import { TaskState } from './types';

/**
 * Task state machine - defines valid transitions between states.
 *
 * Flow: PLANNED → RUNNING → PR_READY → VALIDATING → APPROVAL_PENDING → MERGED → DONE
 *   - VALIDATING can fail → FIXING → VALIDATING (retry loop)
 *   - BLOCKED can happen from most states
 *   - BLOCKED can return to the state it came from
 */
const VALID_TRANSITIONS: Record<TaskState, TaskState[]> = {
  PLANNED: ['RUNNING', 'BLOCKED'],
  RUNNING: ['PR_READY', 'BLOCKED'],
  PR_READY: ['VALIDATING', 'BLOCKED'],
  VALIDATING: ['APPROVAL_PENDING', 'FIXING', 'BLOCKED'],
  FIXING: ['VALIDATING', 'BLOCKED'],
  APPROVAL_PENDING: ['MERGED', 'BLOCKED'],
  MERGED: ['DONE'],
  DONE: [],
  BLOCKED: ['PLANNED', 'RUNNING', 'PR_READY', 'VALIDATING', 'FIXING', 'APPROVAL_PENDING'],
};

export function canTransition(from: TaskState, to: TaskState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidTransitions(from: TaskState): TaskState[] {
  return VALID_TRANSITIONS[from] ?? [];
}

export function getStateColor(state: TaskState): string {
  const colors: Record<TaskState, string> = {
    PLANNED: 'bg-gray-100 text-gray-800',
    RUNNING: 'bg-blue-100 text-blue-800',
    PR_READY: 'bg-indigo-100 text-indigo-800',
    VALIDATING: 'bg-yellow-100 text-yellow-800',
    FIXING: 'bg-orange-100 text-orange-800',
    APPROVAL_PENDING: 'bg-purple-100 text-purple-800',
    MERGED: 'bg-green-100 text-green-800',
    DONE: 'bg-emerald-100 text-emerald-800',
    BLOCKED: 'bg-red-100 text-red-800',
  };
  return colors[state];
}

export function getEpicStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    RUNNING: 'bg-blue-100 text-blue-800',
    BLOCKED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
