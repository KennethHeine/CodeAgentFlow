export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
  html_url: string;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  default_branch: string;
}

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  type: 'file' | 'dir';
  content?: string;
  html_url: string;
  download_url?: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  labels: GitHubLabel[];
  body: string | null;
  created_at: string;
  updated_at: string;
}

export interface GitHubLabel {
  name: string;
  color: string;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  merged: boolean;
  head: { ref: string };
  base: { ref: string };
  labels: GitHubLabel[];
  body: string | null;
  created_at: string;
  updated_at: string;
}
