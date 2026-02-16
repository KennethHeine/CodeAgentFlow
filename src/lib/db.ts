import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Epic, Task, ValidationRun, AuditLog, CreateEpicInput, CreateTaskInput, TaskState } from './types';

const DB_PATH = path.join(process.cwd(), 'codeagentflow.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS epics (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      intent TEXT NOT NULL,
      repo TEXT NOT NULL,
      defaultBranch TEXT NOT NULL DEFAULT 'main',
      constraints TEXT NOT NULL DEFAULT '',
      validationProfile TEXT NOT NULL DEFAULT 'tests,lint',
      mergePolicy TEXT NOT NULL DEFAULT 'manual',
      status TEXT NOT NULL DEFAULT 'DRAFT',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      epicId TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      acceptanceCriteria TEXT NOT NULL DEFAULT '[]',
      state TEXT NOT NULL DEFAULT 'PLANNED',
      prUrl TEXT,
      branchName TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      blockedReason TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (epicId) REFERENCES epics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS validation_runs (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      checks TEXT NOT NULL DEFAULT '[]',
      logsUrl TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      epicId TEXT,
      taskId TEXT,
      action TEXT NOT NULL,
      actor TEXT NOT NULL DEFAULT 'user',
      details TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL
    );
  `);
}

// ── Epic operations ──

export function listEpics(): Epic[] {
  const db = getDb();
  return db.prepare('SELECT * FROM epics ORDER BY createdAt DESC').all() as Epic[];
}

export function getEpic(id: string): Epic | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM epics WHERE id = ?').get(id) as Epic | undefined;
}

export function createEpic(input: CreateEpicInput): Epic {
  const db = getDb();
  const now = new Date().toISOString();
  const epic: Epic = {
    id: uuidv4(),
    ...input,
    status: 'DRAFT',
    createdAt: now,
    updatedAt: now,
  };
  db.prepare(`
    INSERT INTO epics (id, title, intent, repo, defaultBranch, constraints, validationProfile, mergePolicy, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(epic.id, epic.title, epic.intent, epic.repo, epic.defaultBranch, epic.constraints, epic.validationProfile, epic.mergePolicy, epic.status, epic.createdAt, epic.updatedAt);

  addAuditLog(epic.id, null, 'EPIC_CREATED', `Created epic: ${epic.title}`);
  return epic;
}

export function updateEpic(id: string, updates: Partial<Pick<Epic, 'title' | 'intent' | 'status'>>): Epic | undefined {
  const db = getDb();
  const epic = getEpic(id);
  if (!epic) return undefined;

  const now = new Date().toISOString();
  const fields: string[] = ['updatedAt = ?'];
  const values: unknown[] = [now];

  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.intent !== undefined) { fields.push('intent = ?'); values.push(updates.intent); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }

  values.push(id);
  db.prepare(`UPDATE epics SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  if (updates.status) {
    addAuditLog(id, null, 'EPIC_STATUS_CHANGED', `Epic status changed to ${updates.status}`);
  }

  return getEpic(id);
}

export function deleteEpic(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM epics WHERE id = ?').run(id);
  return result.changes > 0;
}

// ── Task operations ──

export function listTasks(epicId: string): Task[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM tasks WHERE epicId = ? ORDER BY "order" ASC').all(epicId) as (Omit<Task, 'acceptanceCriteria'> & { acceptanceCriteria: string })[];
  return rows.map(row => ({
    ...row,
    acceptanceCriteria: JSON.parse(row.acceptanceCriteria as string),
  }));
}

export function getTask(id: string): Task | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as (Omit<Task, 'acceptanceCriteria'> & { acceptanceCriteria: string }) | undefined;
  if (!row) return undefined;
  return {
    ...row,
    acceptanceCriteria: JSON.parse(row.acceptanceCriteria as string),
  };
}

export function createTask(input: CreateTaskInput): Task {
  const db = getDb();
  const now = new Date().toISOString();
  const task: Task = {
    id: uuidv4(),
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
  db.prepare(`
    INSERT INTO tasks (id, epicId, "order", title, description, acceptanceCriteria, state, prUrl, branchName, attempts, blockedReason, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(task.id, task.epicId, task.order, task.title, task.description, JSON.stringify(task.acceptanceCriteria), task.state, task.prUrl, task.branchName, task.attempts, task.blockedReason, task.createdAt, task.updatedAt);

  addAuditLog(task.epicId, task.id, 'TASK_CREATED', `Created task: ${task.title}`);
  return task;
}

export function updateTaskState(
  id: string,
  newState: TaskState,
  extra?: { prUrl?: string; branchName?: string; blockedReason?: string }
): Task | undefined {
  const db = getDb();
  const task = getTask(id);
  if (!task) return undefined;

  const now = new Date().toISOString();
  const fields: string[] = ['state = ?', 'updatedAt = ?'];
  const values: unknown[] = [newState, now];

  if (extra?.prUrl !== undefined) { fields.push('prUrl = ?'); values.push(extra.prUrl); }
  if (extra?.branchName !== undefined) { fields.push('branchName = ?'); values.push(extra.branchName); }
  if (extra?.blockedReason !== undefined) { fields.push('blockedReason = ?'); values.push(extra.blockedReason); }
  if (newState === 'RUNNING' || newState === 'FIXING') { fields.push('attempts = attempts + 1'); }

  values.push(id);
  db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  addAuditLog(task.epicId, id, 'TASK_STATE_CHANGED', `Task state: ${task.state} → ${newState}`);
  return getTask(id);
}

export function deleteTask(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return result.changes > 0;
}

// ── Validation Run operations ──

export function listValidationRuns(taskId: string): ValidationRun[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM validation_runs WHERE taskId = ? ORDER BY createdAt DESC').all(taskId) as (Omit<ValidationRun, 'checks'> & { checks: string })[];
  return rows.map(row => ({
    ...row,
    checks: JSON.parse(row.checks as string),
  }));
}

export function createValidationRun(taskId: string): ValidationRun {
  const db = getDb();
  const now = new Date().toISOString();
  const run: ValidationRun = {
    id: uuidv4(),
    taskId,
    status: 'PENDING',
    checks: [],
    logsUrl: null,
    createdAt: now,
  };
  db.prepare(`
    INSERT INTO validation_runs (id, taskId, status, checks, logsUrl, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(run.id, run.taskId, run.status, JSON.stringify(run.checks), run.logsUrl, run.createdAt);

  const task = getTask(taskId);
  if (task) {
    addAuditLog(task.epicId, taskId, 'VALIDATION_STARTED', 'Validation run started');
  }
  return run;
}

export function updateValidationRun(id: string, status: string, checks?: string[], logsUrl?: string): ValidationRun | undefined {
  const db = getDb();
  const fields: string[] = ['status = ?'];
  const values: unknown[] = [status];

  if (checks !== undefined) { fields.push('checks = ?'); values.push(JSON.stringify(checks)); }
  if (logsUrl !== undefined) { fields.push('logsUrl = ?'); values.push(logsUrl); }

  values.push(id);
  db.prepare(`UPDATE validation_runs SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const row = db.prepare('SELECT * FROM validation_runs WHERE id = ?').get(id) as (Omit<ValidationRun, 'checks'> & { checks: string }) | undefined;
  if (!row) return undefined;
  return { ...row, checks: JSON.parse(row.checks as string) };
}

// ── Audit Log operations ──

export function addAuditLog(epicId: string | null, taskId: string | null, action: string, details: string, actor: string = 'user'): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO audit_logs (id, epicId, taskId, action, actor, details, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), epicId, taskId, action, actor, details, now);
}

export function listAuditLogs(epicId?: string, taskId?: string, limit: number = 50): AuditLog[] {
  const db = getDb();
  let query = 'SELECT * FROM audit_logs';
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (epicId) { conditions.push('epicId = ?'); values.push(epicId); }
  if (taskId) { conditions.push('taskId = ?'); values.push(taskId); }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY createdAt DESC LIMIT ?';
  values.push(limit);

  return db.prepare(query).all(...values) as AuditLog[];
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
