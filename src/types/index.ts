export interface Epic {
  id: string;
  name: string;
  slug: string;
  status: EpicStatus;
  repoFullName: string;
  path: string;
  goal?: string;
  requirements?: string;
  plan?: string;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export type EpicStatus = 'draft' | 'planning' | 'ready' | 'in_progress' | 'completed' | 'archived';

export type EpicStep = 'goal' | 'requirements' | 'plan' | 'tasks';

export interface Task {
  id: string;
  number: number;
  slug: string;
  title: string;
  status: TaskStatus;
  content: string;
  subtasks: Subtask[];
  githubIssueUrl?: string;
  githubPrUrl?: string;
  githubIssueNumber?: number;
  githubPrNumber?: number;
}

export type TaskStatus = 'pending' | 'issue_created' | 'agent_running' | 'pr_open' | 'pr_review' | 'pr_merged' | 'failed';

export interface Subtask {
  id: string;
  title: string;
  type: 'research' | 'work';
  description: string;
  completed: boolean;
}

export interface GitHubRepo {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
  url: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  url: string;
  createdAt: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  labels: string[];
  url: string;
  headBranch: string;
  merged: boolean;
  checks?: CheckStatus;
  createdAt: string;
}

export type CheckStatus = 'pending' | 'success' | 'failure' | 'neutral';

export interface FileContent {
  path: string;
  content: string;
  sha: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface AppSettings {
  epicRepoFullName: string;
  defaultTargetRepo: string;
}
