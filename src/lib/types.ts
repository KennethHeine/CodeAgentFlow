// GitHub-related types

export interface GitHubConfig {
  token: string;
  epicRepo: string; // "owner/repo" format - stores epic markdown specs
}

export interface Epic {
  id: string; // filename-based ID from /epics/ folder
  title: string;
  description: string;
  path: string; // path in the epic repo, e.g., "epics/my-epic.md"
  sha: string; // git SHA for updates
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  targetRepo: string; // "owner/repo" where the work happens
  issueNumber?: number;
  prNumber?: number;
  state: TaskState;
  labels: string[];
}

export type TaskState =
  | 'PLANNED'
  | 'RUNNING'
  | 'PR_READY'
  | 'VALIDATING'
  | 'APPROVAL_PENDING'
  | 'FIXING'
  | 'MERGED'
  | 'DONE'
  | 'BLOCKED';

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: string;
  labels: Array<{ name: string; color: string }>;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  body: string;
  state: string;
  merged: boolean;
  draft: boolean;
  labels: Array<{ name: string; color: string }>;
  html_url: string;
  head: { ref: string; sha: string };
  base: { ref: string };
  created_at: string;
  updated_at: string;
}

export interface GitHubCheckRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
}

export interface RepoContent {
  name: string;
  path: string;
  sha: string;
  type: 'file' | 'dir';
  content?: string; // base64 encoded for files
  encoding?: string;
}
