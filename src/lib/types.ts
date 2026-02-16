// ── Data Model Types ──

export type EpicStatus = 'DRAFT' | 'RUNNING' | 'BLOCKED' | 'COMPLETED';

export type TaskState =
  | 'PLANNED'
  | 'RUNNING'
  | 'PR_READY'
  | 'VALIDATING'
  | 'FIXING'
  | 'APPROVAL_PENDING'
  | 'MERGED'
  | 'DONE'
  | 'BLOCKED';

export type ValidationStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';

export interface Epic {
  id: string;
  title: string;
  intent: string;
  repo: string;
  defaultBranch: string;
  constraints: string;
  validationProfile: string;
  mergePolicy: string;
  status: EpicStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  epicId: string;
  order: number;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  state: TaskState;
  prUrl: string | null;
  branchName: string | null;
  attempts: number;
  blockedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationRun {
  id: string;
  taskId: string;
  status: ValidationStatus;
  checks: string[];
  logsUrl: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  epicId: string | null;
  taskId: string | null;
  action: string;
  actor: string;
  details: string;
  createdAt: string;
}

// ── API Types ──

export interface CreateEpicInput {
  title: string;
  intent: string;
  repo: string;
  defaultBranch: string;
  constraints: string;
  validationProfile: string;
  mergePolicy: string;
}

export interface UpdateEpicInput {
  title?: string;
  intent?: string;
  status?: EpicStatus;
}

export interface CreateTaskInput {
  epicId: string;
  order: number;
  title: string;
  description: string;
  acceptanceCriteria: string[];
}

export interface TransitionInput {
  targetState: TaskState;
  prUrl?: string;
  branchName?: string;
  blockedReason?: string;
}
