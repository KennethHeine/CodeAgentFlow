'use client';

import { useSyncExternalStore } from 'react';
import type { Epic, Task, ValidationRun, AuditLog } from './types';
import * as store from './store';

// Version counter to notify subscribers of changes
let storeVersion = 0;
const listeners = new Set<() => void>();

function emitChange() {
  storeVersion++;
  listeners.forEach(l => l());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getVersion(): number {
  return storeVersion;
}

function getServerVersion(): number {
  return -1;
}

export function useEpics(): Epic[] {
  const version = useSyncExternalStore(subscribe, getVersion, getServerVersion);
  // version is used to trigger re-render; actual data comes from store
  return version >= 0 ? store.listEpics() : [];
}

export function useEpicDetail(epicId: string) {
  const version = useSyncExternalStore(subscribe, getVersion, getServerVersion);

  if (version < 0) {
    return { epic: null, tasks: [] as Task[], auditLogs: [] as AuditLog[] };
  }

  const epic = store.getEpic(epicId) ?? null;
  const tasks = epic ? store.listTasks(epicId) : [];
  const auditLogs = epic ? store.listAuditLogs(epicId) : [];
  return { epic, tasks, auditLogs };
}

export function useTaskDetail(taskId: string) {
  const version = useSyncExternalStore(subscribe, getVersion, getServerVersion);

  if (version < 0) {
    return { task: null, validationRuns: [] as ValidationRun[], auditLogs: [] as AuditLog[] };
  }

  const task = store.getTask(taskId) ?? null;
  const validationRuns = task ? store.listValidationRuns(taskId) : [];
  const auditLogs = task ? store.listAuditLogs(undefined, taskId) : [];
  return { task, validationRuns, auditLogs };
}

// Wrapped store actions that emit changes
export function createEpic(...args: Parameters<typeof store.createEpic>) {
  const result = store.createEpic(...args);
  emitChange();
  return result;
}

export function updateEpic(...args: Parameters<typeof store.updateEpic>) {
  const result = store.updateEpic(...args);
  emitChange();
  return result;
}

export function deleteEpic(...args: Parameters<typeof store.deleteEpic>) {
  const result = store.deleteEpic(...args);
  emitChange();
  return result;
}

export function createTask(...args: Parameters<typeof store.createTask>) {
  const result = store.createTask(...args);
  emitChange();
  return result;
}

export function updateTaskState(...args: Parameters<typeof store.updateTaskState>) {
  const result = store.updateTaskState(...args);
  emitChange();
  return result;
}

export function deleteTask(...args: Parameters<typeof store.deleteTask>) {
  const result = store.deleteTask(...args);
  emitChange();
  return result;
}

export function createValidationRun(...args: Parameters<typeof store.createValidationRun>) {
  const result = store.createValidationRun(...args);
  emitChange();
  return result;
}

export function updateValidationRun(...args: Parameters<typeof store.updateValidationRun>) {
  const result = store.updateValidationRun(...args);
  emitChange();
  return result;
}

export { generatePlan } from './store';
