import type { Epic, Task, ValidationRun, AuditLog, CreateEpicInput, CreateTaskInput, TaskState } from './types';

const STORAGE_KEYS = {
  EPICS: 'codeagentflow_epics',
  TASKS: 'codeagentflow_tasks',
  VALIDATION_RUNS: 'codeagentflow_validation_runs',
  AUDIT_LOGS: 'codeagentflow_audit_logs',
} as const;

function generateId(): string {
  return crypto.randomUUID();
}

function getCollection<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setCollection<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Epic operations ──

export function listEpics(): Epic[] {
  return getCollection<Epic>(STORAGE_KEYS.EPICS).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getEpic(id: string): Epic | undefined {
  return getCollection<Epic>(STORAGE_KEYS.EPICS).find(e => e.id === id);
}

export function createEpic(input: CreateEpicInput): Epic {
  const now = new Date().toISOString();
  const epic: Epic = {
    id: generateId(),
    ...input,
    status: 'DRAFT',
    createdAt: now,
    updatedAt: now,
  };
  const epics = getCollection<Epic>(STORAGE_KEYS.EPICS);
  epics.push(epic);
  setCollection(STORAGE_KEYS.EPICS, epics);

  addAuditLog(epic.id, null, 'EPIC_CREATED', `Created epic: ${epic.title}`);
  return epic;
}

export function updateEpic(id: string, updates: Partial<Pick<Epic, 'title' | 'intent' | 'status'>>): Epic | undefined {
  const epics = getCollection<Epic>(STORAGE_KEYS.EPICS);
  const index = epics.findIndex(e => e.id === id);
  if (index === -1) return undefined;

  const now = new Date().toISOString();
  epics[index] = { ...epics[index], ...updates, updatedAt: now };
  setCollection(STORAGE_KEYS.EPICS, epics);

  if (updates.status) {
    addAuditLog(id, null, 'EPIC_STATUS_CHANGED', `Epic status changed to ${updates.status}`);
  }

  return epics[index];
}

export function deleteEpic(id: string): boolean {
  const epics = getCollection<Epic>(STORAGE_KEYS.EPICS);
  const filtered = epics.filter(e => e.id !== id);
  if (filtered.length === epics.length) return false;
  setCollection(STORAGE_KEYS.EPICS, filtered);

  // Cascade delete tasks, validation runs, and audit logs
  const tasks = getCollection<Task>(STORAGE_KEYS.TASKS);
  const taskIds = tasks.filter(t => t.epicId === id).map(t => t.id);
  setCollection(STORAGE_KEYS.TASKS, tasks.filter(t => t.epicId !== id));
  setCollection(STORAGE_KEYS.VALIDATION_RUNS,
    getCollection<ValidationRun>(STORAGE_KEYS.VALIDATION_RUNS).filter(v => !taskIds.includes(v.taskId))
  );

  return true;
}

// ── Task operations ──

export function listTasks(epicId: string): Task[] {
  return getCollection<Task>(STORAGE_KEYS.TASKS)
    .filter(t => t.epicId === epicId)
    .sort((a, b) => a.order - b.order);
}

export function getTask(id: string): Task | undefined {
  return getCollection<Task>(STORAGE_KEYS.TASKS).find(t => t.id === id);
}

export function createTask(input: CreateTaskInput): Task {
  const now = new Date().toISOString();
  const task: Task = {
    id: generateId(),
    epicId: input.epicId,
    order: input.order,
    title: input.title,
    description: input.description,
    acceptanceCriteria: input.acceptanceCriteria,
    state: 'PLANNED',
    prUrl: null,
    branchName: null,
    attempts: 0,
    blockedReason: null,
    createdAt: now,
    updatedAt: now,
  };
  const tasks = getCollection<Task>(STORAGE_KEYS.TASKS);
  tasks.push(task);
  setCollection(STORAGE_KEYS.TASKS, tasks);

  addAuditLog(task.epicId, task.id, 'TASK_CREATED', `Created task: ${task.title}`);
  return task;
}

export function updateTaskState(
  id: string,
  newState: TaskState,
  extra?: { prUrl?: string; branchName?: string; blockedReason?: string }
): Task | undefined {
  const tasks = getCollection<Task>(STORAGE_KEYS.TASKS);
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return undefined;

  const oldState = tasks[index].state;
  const now = new Date().toISOString();
  tasks[index] = {
    ...tasks[index],
    state: newState,
    updatedAt: now,
    ...(extra?.prUrl !== undefined && { prUrl: extra.prUrl }),
    ...(extra?.branchName !== undefined && { branchName: extra.branchName }),
    ...(extra?.blockedReason !== undefined && { blockedReason: extra.blockedReason }),
    ...(newState === 'RUNNING' || newState === 'FIXING'
      ? { attempts: tasks[index].attempts + 1 }
      : {}),
  };
  setCollection(STORAGE_KEYS.TASKS, tasks);

  addAuditLog(tasks[index].epicId, id, 'TASK_STATE_CHANGED', `Task state: ${oldState} → ${newState}`);
  return tasks[index];
}

export function deleteTask(id: string): boolean {
  const tasks = getCollection<Task>(STORAGE_KEYS.TASKS);
  const filtered = tasks.filter(t => t.id !== id);
  if (filtered.length === tasks.length) return false;
  setCollection(STORAGE_KEYS.TASKS, filtered);

  // Cascade delete validation runs
  setCollection(STORAGE_KEYS.VALIDATION_RUNS,
    getCollection<ValidationRun>(STORAGE_KEYS.VALIDATION_RUNS).filter(v => v.taskId !== id)
  );
  return true;
}

// ── Validation Run operations ──

export function listValidationRuns(taskId: string): ValidationRun[] {
  return getCollection<ValidationRun>(STORAGE_KEYS.VALIDATION_RUNS)
    .filter(v => v.taskId === taskId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createValidationRun(taskId: string): ValidationRun {
  const now = new Date().toISOString();
  const run: ValidationRun = {
    id: generateId(),
    taskId,
    status: 'PENDING',
    checks: [],
    logsUrl: null,
    createdAt: now,
  };
  const runs = getCollection<ValidationRun>(STORAGE_KEYS.VALIDATION_RUNS);
  runs.push(run);
  setCollection(STORAGE_KEYS.VALIDATION_RUNS, runs);

  const task = getTask(taskId);
  if (task) {
    addAuditLog(task.epicId, taskId, 'VALIDATION_STARTED', 'Validation run started');
  }
  return run;
}

export function updateValidationRun(id: string, status: string, checks?: string[], logsUrl?: string): ValidationRun | undefined {
  const runs = getCollection<ValidationRun>(STORAGE_KEYS.VALIDATION_RUNS);
  const index = runs.findIndex(r => r.id === id);
  if (index === -1) return undefined;

  runs[index] = {
    ...runs[index],
    status: status as ValidationRun['status'],
    ...(checks !== undefined && { checks }),
    ...(logsUrl !== undefined && { logsUrl }),
  };
  setCollection(STORAGE_KEYS.VALIDATION_RUNS, runs);
  return runs[index];
}

// ── Audit Log operations ──

export function addAuditLog(epicId: string | null, taskId: string | null, action: string, details: string, actor: string = 'user'): void {
  const now = new Date().toISOString();
  const log: AuditLog = {
    id: generateId(),
    epicId,
    taskId,
    action,
    actor,
    details,
    createdAt: now,
  };
  const logs = getCollection<AuditLog>(STORAGE_KEYS.AUDIT_LOGS);
  logs.push(log);
  setCollection(STORAGE_KEYS.AUDIT_LOGS, logs);
}

export function listAuditLogs(epicId?: string, taskId?: string, limit: number = 50): AuditLog[] {
  let logs = getCollection<AuditLog>(STORAGE_KEYS.AUDIT_LOGS);

  if (epicId) logs = logs.filter(l => l.epicId === epicId);
  if (taskId) logs = logs.filter(l => l.taskId === taskId);

  return logs
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

// ── Default plan generation (v1 placeholder) ──
// In v1, we generate a reasonable default set of tasks from the intent.
// In production, this would call an LLM or planning service.

export function generatePlan(intent: string): CreateTaskInput[] {
  const tasks: CreateTaskInput[] = [
    {
      epicId: '', // will be set by caller
      order: 1,
      title: 'Project scaffolding and configuration',
      description: `Set up the initial project structure for: ${intent}`,
      acceptanceCriteria: [
        'Project initialized with required dependencies',
        'Configuration files created',
        'Build and lint pass',
      ],
    },
    {
      epicId: '',
      order: 2,
      title: 'Data models and database schema',
      description: 'Define and implement the core data models and database schema.',
      acceptanceCriteria: [
        'All data models defined with TypeScript types',
        'Database migrations or schema created',
        'Basic CRUD operations working',
      ],
    },
    {
      epicId: '',
      order: 3,
      title: 'Core API endpoints',
      description: 'Implement the main API endpoints for the application.',
      acceptanceCriteria: [
        'REST endpoints for all core resources',
        'Input validation on all endpoints',
        'Proper error handling and status codes',
      ],
    },
    {
      epicId: '',
      order: 4,
      title: 'Core UI layout and navigation',
      description: 'Build the main application layout, navigation, and routing.',
      acceptanceCriteria: [
        'Main layout with navigation',
        'All page routes configured',
        'Responsive design working',
      ],
    },
    {
      epicId: '',
      order: 5,
      title: 'Primary feature implementation',
      description: `Implement the primary feature set for: ${intent}`,
      acceptanceCriteria: [
        'Core feature logic implemented',
        'UI components for the primary workflow',
        'Integration between frontend and API',
      ],
    },
    {
      epicId: '',
      order: 6,
      title: 'Secondary features and polish',
      description: 'Add secondary features, error handling, and UI polish.',
      acceptanceCriteria: [
        'Edge cases handled',
        'Loading and error states shown',
        'Validation and feedback messages',
      ],
    },
    {
      epicId: '',
      order: 7,
      title: 'Testing and documentation',
      description: 'Add tests and documentation for the project.',
      acceptanceCriteria: [
        'Unit tests for critical paths',
        'README with setup instructions',
        'All tests passing',
      ],
    },
  ];

  return tasks;
}
