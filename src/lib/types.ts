export type EpicStatus = "DRAFT" | "RUNNING" | "BLOCKED" | "COMPLETED";

export type TaskState =
  | "PLANNED"
  | "RUNNING"
  | "PR_READY"
  | "VALIDATING"
  | "FIXING"
  | "APPROVAL_PENDING"
  | "MERGED"
  | "DONE"
  | "BLOCKED";

export type ValidationStatus = "PENDING" | "PASSED" | "FAILED";

export type MergePolicy = "MANUAL_APPROVAL_REQUIRED";

export interface Epic {
  id: number;
  title: string;
  intent: string;
  repo: string;
  defaultBranch: string;
  constraints: string;
  validationProfile: string;
  mergePolicy: MergePolicy;
  status: EpicStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  epicId: number;
  order: number;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  state: TaskState;
  prUrl: string | null;
  branchName: string | null;
  validationRuns: ValidationRun[];
  attempts: number;
  mergeApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationRun {
  id: number;
  taskId: number;
  status: ValidationStatus;
  checks: string[];
  logsUrl: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  epicId: number | null;
  taskId: number | null;
  actor: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface TaskEvent {
  id: number;
  taskId: number;
  fromState: TaskState | null;
  toState: TaskState;
  note: string;
  createdAt: string;
}
