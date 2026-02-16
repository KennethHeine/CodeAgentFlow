import type {
  GitHubIssue,
  GitHubPR,
  GitHubCheckRun,
  RepoContent,
} from './types';

const BASE_URL = 'https://api.github.com';

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}

async function request<T>(
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new GitHubError(
      `GitHub API error: ${res.status} ${res.statusText}`,
      res.status,
      body,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function createGitHubClient(token: string) {
  return {
    /** Get file or directory contents */
    getRepoContents(
      owner: string,
      repo: string,
      path: string,
    ): Promise<RepoContent | RepoContent[]> {
      return request<RepoContent | RepoContent[]>(
        token,
        `/repos/${owner}/${repo}/contents/${path}`,
      );
    },

    /** Get decoded file content (UTF-8) */
    async getFileContent(
      owner: string,
      repo: string,
      path: string,
    ): Promise<{ content: string; sha: string }> {
      const file = await request<RepoContent>(
        token,
        `/repos/${owner}/${repo}/contents/${path}`,
      );
      if (file.type !== 'file' || !file.content) {
        throw new GitHubError(`Path is not a file: ${path}`, 422);
      }
      const decoded = atob(file.content.replace(/\n/g, ''));
      return { content: decoded, sha: file.sha };
    },

    /** Create or update a file */
    createOrUpdateFile(
      owner: string,
      repo: string,
      path: string,
      content: string,
      message: string,
      sha?: string,
    ): Promise<{ content: RepoContent; commit: { sha: string } }> {
      const encoded = btoa(
        new Uint8Array(new TextEncoder().encode(content))
          .reduce((acc, byte) => acc + String.fromCharCode(byte), ''),
      );
      return request<{ content: RepoContent; commit: { sha: string } }>(
        token,
        `/repos/${owner}/${repo}/contents/${path}`,
        {
          method: 'PUT',
          body: JSON.stringify({ message, content: encoded, ...(sha && { sha }) }),
        },
      );
    },

    /** Delete a file */
    deleteFile(
      owner: string,
      repo: string,
      path: string,
      sha: string,
      message: string,
    ): Promise<void> {
      return request<void>(
        token,
        `/repos/${owner}/${repo}/contents/${path}`,
        {
          method: 'DELETE',
          body: JSON.stringify({ message, sha }),
        },
      );
    },

    /** List issues, optionally filtered by labels */
    listIssues(
      owner: string,
      repo: string,
      labels?: string[],
    ): Promise<GitHubIssue[]> {
      const params = new URLSearchParams({ state: 'all', per_page: '100' });
      if (labels?.length) {
        params.set('labels', labels.join(','));
      }
      return request<GitHubIssue[]>(
        token,
        `/repos/${owner}/${repo}/issues?${params}`,
      );
    },

    /** Get a single issue */
    getIssue(
      owner: string,
      repo: string,
      number: number,
    ): Promise<GitHubIssue> {
      return request<GitHubIssue>(
        token,
        `/repos/${owner}/${repo}/issues/${number}`,
      );
    },

    /** Create an issue */
    createIssue(
      owner: string,
      repo: string,
      title: string,
      body: string,
      labels?: string[],
    ): Promise<GitHubIssue> {
      return request<GitHubIssue>(
        token,
        `/repos/${owner}/${repo}/issues`,
        {
          method: 'POST',
          body: JSON.stringify({ title, body, labels }),
        },
      );
    },

    /** List pull requests */
    listPRs(
      owner: string,
      repo: string,
      state: 'open' | 'closed' | 'all' = 'all',
    ): Promise<GitHubPR[]> {
      const params = new URLSearchParams({ state, per_page: '100' });
      return request<GitHubPR[]>(
        token,
        `/repos/${owner}/${repo}/pulls?${params}`,
      );
    },

    /** Get a single pull request */
    getPR(
      owner: string,
      repo: string,
      number: number,
    ): Promise<GitHubPR> {
      return request<GitHubPR>(
        token,
        `/repos/${owner}/${repo}/pulls/${number}`,
      );
    },

    /** Get check runs for a git ref */
    getCheckRuns(
      owner: string,
      repo: string,
      ref: string,
    ): Promise<GitHubCheckRun[]> {
      return request<{ check_runs: GitHubCheckRun[] }>(
        token,
        `/repos/${owner}/${repo}/commits/${ref}/check-runs`,
      ).then((data) => data.check_runs);
    },

    /** Validate token by fetching authenticated user */
    async validateToken(): Promise<{ login: string; avatar_url: string }> {
      return request<{ login: string; avatar_url: string }>(token, '/user');
    },
  };
}

export type GitHubClient = ReturnType<typeof createGitHubClient>;
