import Database from "better-sqlite3";
import path from "node:path";
import { assertTransition } from "@/lib/state-machine";
import {
  AuditLog,
  Epic,
  EpicStatus,
  Task,
  TaskEvent,
  TaskState,
  ValidationRun,
  ValidationStatus,
} from "@/lib/types";

const dbFile = path.join(process.cwd(), "codeagentflow.db");
const db = new Database(dbFile);
db.pragma("journal_mode = WAL");

function nowIso() {
  return new Date().toISOString();
}

function asJson<T>(value: T) {
  return JSON.stringify(value);
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

db.exec(`
CREATE TABLE IF NOT EXISTS epics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  intent TEXT NOT NULL,
  repo TEXT NOT NULL,
  default_branch TEXT NOT NULL,
  constraints_json TEXT NOT NULL,
  validation_profile TEXT NOT NULL,
  merge_policy TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  epic_id INTEGER NOT NULL,
  task_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  acceptance_criteria_json TEXT NOT NULL,
  state TEXT NOT NULL,
  pr_url TEXT,
  branch_name TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  merge_approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(epic_id) REFERENCES epics(id)
);

CREATE TABLE IF NOT EXISTS validation_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  checks_json TEXT NOT NULL,
  logs_url TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS task_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  epic_id INTEGER,
  task_id INTEGER,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(epic_id) REFERENCES epics(id),
  FOREIGN KEY(task_id) REFERENCES tasks(id)
);
`);

function mapEpic(row: Record<string, unknown>): Epic {
  return {
    id: Number(row.id),
    title: String(row.title),
    intent: String(row.intent),
    repo: String(row.repo),
    defaultBranch: String(row.default_branch),
    constraints: String(row.constraints_json),
    validationProfile: String(row.validation_profile),
    mergePolicy: String(row.merge_policy) as Epic["mergePolicy"],
    status: String(row.status) as EpicStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapTask(row: Record<string, unknown>): Task {
  return {
    id: Number(row.id),
    epicId: Number(row.epic_id),
    order: Number(row.task_order),
    title: String(row.title),
    description: String(row.description),
    acceptanceCriteria: parseJson(String(row.acceptance_criteria_json), []),
    state: String(row.state) as TaskState,
    prUrl: row.pr_url ? String(row.pr_url) : null,
    branchName: row.branch_name ? String(row.branch_name) : null,
    validationRuns: [],
    attempts: Number(row.attempts),
    mergeApproved: Number(row.merge_approved) === 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapValidationRun(row: Record<string, unknown>): ValidationRun {
  return {
    id: Number(row.id),
    taskId: Number(row.task_id),
    status: String(row.status) as ValidationStatus,
    checks: parseJson(String(row.checks_json), []),
    logsUrl: row.logs_url ? String(row.logs_url) : null,
    createdAt: String(row.created_at),
  };
}

function mapTaskEvent(row: Record<string, unknown>): TaskEvent {
  return {
    id: Number(row.id),
    taskId: Number(row.task_id),
    fromState: row.from_state ? (String(row.from_state) as TaskState) : null,
    toState: String(row.to_state) as TaskState,
    note: String(row.note),
    createdAt: String(row.created_at),
  };
}

function mapAuditLog(row: Record<string, unknown>): AuditLog {
  return {
    id: Number(row.id),
    epicId: row.epic_id ? Number(row.epic_id) : null,
    taskId: row.task_id ? Number(row.task_id) : null,
    actor: String(row.actor),
    action: String(row.action),
    details: String(row.details),
    createdAt: String(row.created_at),
  };
}

export function listEpics() {
  const rows = db
    .prepare("SELECT * FROM epics ORDER BY updated_at DESC")
    .all() as Record<string, unknown>[];
  return rows.map(mapEpic);
}

export function createEpic(input: {
  title: string;
  intent: string;
  repo: string;
  defaultBranch: string;
  constraints: string;
  validationProfile: string;
  mergePolicy: string;
  tasks: Array<{ title: string; description: string; acceptanceCriteria: string[] }>;
}) {
  const now = nowIso();
  const transaction = db.transaction(() => {
    const epicInsert = db
      .prepare(
        `INSERT INTO epics
         (title, intent, repo, default_branch, constraints_json, validation_profile, merge_policy, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.title,
        input.intent,
        input.repo,
        input.defaultBranch,
        input.constraints,
        input.validationProfile,
        input.mergePolicy,
        "DRAFT",
        now,
        now
      );

    const epicId = Number(epicInsert.lastInsertRowid);
    const taskInsert = db.prepare(
      `INSERT INTO tasks
       (epic_id, task_order, title, description, acceptance_criteria_json, state, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    input.tasks.forEach((task, index) => {
      taskInsert.run(
        epicId,
        index + 1,
        task.title,
        task.description,
        asJson(task.acceptanceCriteria),
        "PLANNED",
        now,
        now
      );
    });

    addAuditLog({
      epicId,
      actor: "user",
      action: "CREATE_EPIC",
      details: `Epic created with ${input.tasks.length} planned tasks`,
    });

    return epicId;
  });

  const epicId = transaction();
  return getEpicWithTasks(epicId);
}

export function getEpicWithTasks(epicId: number) {
  const epicRow = db.prepare("SELECT * FROM epics WHERE id = ?").get(epicId) as
    | Record<string, unknown>
    | undefined;
  if (!epicRow) return null;

  const taskRows = db
    .prepare("SELECT * FROM tasks WHERE epic_id = ? ORDER BY task_order ASC")
    .all(epicId) as Record<string, unknown>[];

  const tasks = taskRows.map(mapTask).map((task) => ({
    ...task,
    validationRuns: listValidationRunsForTask(task.id),
  }));

  const auditLogs = db
    .prepare("SELECT * FROM audit_logs WHERE epic_id = ? ORDER BY created_at DESC LIMIT 50")
    .all(epicId) as Record<string, unknown>[];

  return {
    epic: mapEpic(epicRow),
    tasks,
    auditLogs: auditLogs.map(mapAuditLog),
  };
}

function listValidationRunsForTask(taskId: number) {
  const rows = db
    .prepare("SELECT * FROM validation_runs WHERE task_id = ? ORDER BY created_at DESC")
    .all(taskId) as Record<string, unknown>[];
  return rows.map(mapValidationRun);
}

function listTaskEvents(taskId: number) {
  const rows = db
    .prepare("SELECT * FROM task_events WHERE task_id = ? ORDER BY created_at DESC")
    .all(taskId) as Record<string, unknown>[];
  return rows.map(mapTaskEvent);
}

export function getTaskDetail(taskId: number) {
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;

  const task = mapTask(row);
  const epicRow = db.prepare("SELECT * FROM epics WHERE id = ?").get(task.epicId) as
    | Record<string, unknown>
    | undefined;

  return {
    task: {
      ...task,
      validationRuns: listValidationRunsForTask(task.id),
    },
    epic: epicRow ? mapEpic(epicRow) : null,
    events: listTaskEvents(taskId),
    auditLogs: (db
      .prepare("SELECT * FROM audit_logs WHERE task_id = ? ORDER BY created_at DESC LIMIT 50")
      .all(taskId) as Record<string, unknown>[]).map(mapAuditLog),
  };
}

function addAuditLog(input: {
  epicId?: number;
  taskId?: number;
  actor: string;
  action: string;
  details: string;
}) {
  db.prepare(
    `INSERT INTO audit_logs (epic_id, task_id, actor, action, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(input.epicId ?? null, input.taskId ?? null, input.actor, input.action, input.details, nowIso());
}

function transitionTask(taskId: number, toState: TaskState, note: string) {
  const taskRow = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as
    | Record<string, unknown>
    | undefined;
  if (!taskRow) {
    throw new Error("Task not found");
  }

  const task = mapTask(taskRow);
  assertTransition(task.state, toState);

  db.prepare("UPDATE tasks SET state = ?, updated_at = ? WHERE id = ?").run(toState, nowIso(), taskId);
  db.prepare(
    "INSERT INTO task_events (task_id, from_state, to_state, note, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(taskId, task.state, toState, note, nowIso());
}

function setEpicStatus(epicId: number) {
  const states = db
    .prepare("SELECT state FROM tasks WHERE epic_id = ?")
    .all(epicId) as Array<{ state: TaskState }>;
  const values = states.map((state) => state.state);

  let status: EpicStatus = "DRAFT";
  if (values.length > 0 && values.every((value) => value === "DONE")) {
    status = "COMPLETED";
  } else if (values.some((value) => value === "BLOCKED")) {
    status = "BLOCKED";
  } else if (values.some((value) => value !== "PLANNED")) {
    status = "RUNNING";
  }

  db.prepare("UPDATE epics SET status = ?, updated_at = ? WHERE id = ?").run(status, nowIso(), epicId);
}

function updateTaskAttempt(taskId: number) {
  db.prepare("UPDATE tasks SET attempts = attempts + 1, updated_at = ? WHERE id = ?").run(nowIso(), taskId);
}

function updateTaskPr(taskId: number, branchName: string, prUrl: string) {
  db.prepare("UPDATE tasks SET branch_name = ?, pr_url = ?, updated_at = ? WHERE id = ?").run(
    branchName,
    prUrl,
    nowIso(),
    taskId
  );
}

function createValidationRun(taskId: number, status: ValidationStatus, checks: string[], logsUrl: string) {
  db.prepare(
    `INSERT INTO validation_runs (task_id, status, checks_json, logs_url, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(taskId, status, asJson(checks), logsUrl, nowIso());
}

export function performTaskAction(
  taskId: number,
  action: string,
  input: { note?: string; validationResult?: ValidationStatus } = {}
) {
  const detail = getTaskDetail(taskId);
  if (!detail) {
    throw new Error("Task not found");
  }

  const task = detail.task;
  const epic = detail.epic;
  if (!epic) {
    throw new Error("Epic not found");
  }

  const tx = db.transaction(() => {
    switch (action) {
      case "START_TASK":
      case "TRIGGER_AGENT_RUN": {
        if (task.state === "FIXING") {
          updateTaskAttempt(taskId);
          addAuditLog({
            epicId: epic.id,
            taskId,
            actor: "user",
            action,
            details: "Fix validation sub-task triggered on existing PR branch",
          });
          break;
        }

        if (task.state === "BLOCKED") {
          transitionTask(taskId, "RUNNING", "Retrying blocked task");
        } else if (task.state === "PLANNED") {
          transitionTask(taskId, "RUNNING", "Task started by user");
        } else {
          throw new Error("Task can only be started from PLANNED or BLOCKED");
        }

        updateTaskAttempt(taskId);
        const nextAttempt = task.attempts + 1;
        const branchName = `task-${taskId}-attempt-${nextAttempt}`;
        const prUrl = `https://github.com/${epic.repo}/pull/${taskId}`;
        updateTaskPr(taskId, branchName, prUrl);
        transitionTask(taskId, "PR_READY", "Agent run produced/updated PR");
        addAuditLog({
          epicId: epic.id,
          taskId,
          actor: "user",
          action,
          details: `Agent run triggered for branch ${branchName}`,
        });
        break;
      }
      case "RERUN_VALIDATION": {
        if (task.state === "PR_READY" || task.state === "FIXING") {
          transitionTask(taskId, "VALIDATING", "Validation run started");
        } else if (task.state !== "VALIDATING") {
          throw new Error("Validation can only run from PR_READY, FIXING or VALIDATING");
        }

        const status = input.validationResult
          ? input.validationResult
          : task.attempts > 1
            ? "PASSED"
            : "FAILED";
        const checks =
          status === "PASSED"
            ? ["Tests: passing", "Lint: passing", "CodeQL: passing"]
            : ["Tests: failing", "Lint: passing", "CodeQL: passing"];

        createValidationRun(
          taskId,
          status,
          checks,
          `https://github.com/${epic.repo}/actions?query=task-${taskId}`
        );

        if (status === "FAILED") {
          transitionTask(taskId, "FIXING", "Validation failed, fix sub-task created");
        } else {
          transitionTask(taskId, "APPROVAL_PENDING", "Validation passed and awaiting approval");
        }

        addAuditLog({
          epicId: epic.id,
          taskId,
          actor: "user",
          action,
          details: `Validation run completed with status ${status}`,
        });
        break;
      }
      case "APPROVE_MERGE": {
        if (task.state !== "APPROVAL_PENDING") {
          throw new Error("Task must be in APPROVAL_PENDING before approval");
        }
        db.prepare("UPDATE tasks SET merge_approved = 1, updated_at = ? WHERE id = ?").run(nowIso(), taskId);
        addAuditLog({
          epicId: epic.id,
          taskId,
          actor: "user",
          action,
          details: "Merge approved by user",
        });
        break;
      }
      case "MERGE": {
        if (task.state !== "APPROVAL_PENDING") {
          throw new Error("Task must be in APPROVAL_PENDING before merge");
        }
        const freshTask = mapTask(
          db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as Record<string, unknown>
        );
        if (!freshTask.mergeApproved) {
          throw new Error("Merge approval is required before merge");
        }
        transitionTask(taskId, "MERGED", "User merged PR");
        transitionTask(taskId, "DONE", "Task marked done after merge");
        addAuditLog({
          epicId: epic.id,
          taskId,
          actor: "user",
          action,
          details: "PR merged after explicit approval",
        });
        break;
      }
      case "MARK_BLOCKED": {
        const note = input.note?.trim();
        if (!note) {
          throw new Error("Blocking note is required");
        }
        if (task.state !== "BLOCKED") {
          transitionTask(taskId, "BLOCKED", note);
        }
        addAuditLog({
          epicId: epic.id,
          taskId,
          actor: "user",
          action,
          details: `Task blocked: ${note}`,
        });
        break;
      }
      case "RETRY": {
        if (task.state !== "BLOCKED") {
          throw new Error("Only blocked tasks can be retried");
        }
        transitionTask(taskId, "PLANNED", "Task retried by user");
        addAuditLog({
          epicId: epic.id,
          taskId,
          actor: "user",
          action,
          details: "Task moved back to planned",
        });
        break;
      }
      case "SKIP_TASK": {
        if (task.state !== "DONE") {
          transitionTask(taskId, "DONE", "Task skipped by user");
        }
        addAuditLog({
          epicId: epic.id,
          taskId,
          actor: "user",
          action,
          details: "Task skipped",
        });
        break;
      }
      default:
        throw new Error(`Unsupported action ${action}`);
    }

    setEpicStatus(epic.id);
  });

  tx();
  return getTaskDetail(taskId);
}
