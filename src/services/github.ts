import { Octokit } from '@octokit/rest';

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  content?: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  html_url: string;
  labels: Array<{ name: string }>;
  created_at: string;
  updated_at: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  state: string;
  html_url: string;
  head: { ref: string };
  base: { ref: string };
  mergeable: boolean | null;
  merged: boolean;
  created_at: string;
  updated_at: string;
}

export class GitHubClient {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  /**
   * Validate the token and required scopes
   */
  async validateToken(): Promise<{ valid: boolean; scopes: string[]; user: string }> {
    try {
      const { data: user } = await this.octokit.users.getAuthenticated();
      const { headers } = await this.octokit.request('HEAD /');
      const scopes = headers['x-oauth-scopes']?.split(',').map((s) => s.trim()) || [];

      return {
        valid: true,
        scopes,
        user: user.login,
      };
    } catch (error) {
      return {
        valid: false,
        scopes: [],
        user: '',
      };
    }
  }

  /**
   * Get file content from a repository
   */
  async getFile(owner: string, repo: string, path: string, ref?: string): Promise<string> {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    if ('content' in data && data.type === 'file') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }

    throw new Error('Not a file');
  }

  /**
   * List directory contents
   */
  async listDirectory(owner: string, repo: string, path: string = ''): Promise<GitHubFile[]> {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if (Array.isArray(data)) {
      return data.map((item) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        size: item.size,
        type: item.type as 'file' | 'dir',
      }));
    }

    return [];
  }

  /**
   * Create or update a file in a repository
   */
  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string
  ): Promise<void> {
    await this.octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
    });
  }

  /**
   * Create a new issue
   */
  async createIssue(
    owner: string,
    repo: string,
    title: string,
    body: string,
    labels?: string[]
  ): Promise<GitHubIssue> {
    const { data } = await this.octokit.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    });

    return {
      number: data.number,
      title: data.title,
      state: data.state,
      html_url: data.html_url,
      labels: data.labels as Array<{ name: string }>,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * List issues for a repository
   */
  async listIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
    const { data } = await this.octokit.issues.listForRepo({
      owner,
      repo,
      state,
    });

    return data.map((issue) => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      html_url: issue.html_url,
      labels: issue.labels as Array<{ name: string }>,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    }));
  }

  /**
   * List pull requests for a repository
   */
  async listPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubPR[]> {
    const { data } = await this.octokit.pulls.list({
      owner,
      repo,
      state,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((pr: any) => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      html_url: pr.html_url,
      head: { ref: pr.head.ref },
      base: { ref: pr.base.ref },
      mergeable: pr.mergeable ?? null,
      merged: pr.merged ?? false,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
    }));
  }

  /**
   * Get authenticated user info
   */
  async getUser() {
    const { data } = await this.octokit.users.getAuthenticated();
    return data;
  }
}
