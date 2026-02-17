import { Octokit } from '@octokit/rest';
import { cache } from './cache';
import type { GitHubRepo, FileContent, GitHubIssue, GitHubPR } from '@/types';

let octokitInstance: Octokit | null = null;

export function initOctokit(token: string): Octokit {
  octokitInstance = new Octokit({ auth: token });
  return octokitInstance;
}

export function getOctokit(): Octokit {
  if (!octokitInstance) {
    const token = localStorage.getItem('caf:pat');
    if (token) {
      octokitInstance = new Octokit({ auth: token });
    } else {
      throw new Error('GitHub PAT not configured');
    }
  }
  return octokitInstance;
}

export function clearOctokit(): void {
  octokitInstance = null;
}

export async function validateToken(token: string): Promise<{ valid: boolean; login?: string; error?: string }> {
  try {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.users.getAuthenticated();
    return { valid: true, login: data.login };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid token';
    return { valid: false, error: message };
  }
}

export async function listRepos(): Promise<GitHubRepo[]> {
  const cached = cache.get<GitHubRepo[]>('repos');
  if (cached) return cached;

  const octokit = getOctokit();
  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100,
    type: 'owner',
  });

  const repos: GitHubRepo[] = data.map(r => ({
    owner: r.owner.login,
    name: r.name,
    fullName: r.full_name,
    defaultBranch: r.default_branch,
    private: r.private,
    url: r.html_url,
  }));

  cache.set('repos', repos, 2 * 60 * 1000);
  return repos;
}

export async function getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<FileContent> {
  const cacheKey = `file:${owner}/${repo}/${path}:${ref ?? 'default'}`;
  const cached = cache.get<FileContent>(cacheKey);
  if (cached) return cached;

  const octokit = getOctokit();
  const params: { owner: string; repo: string; path: string; ref?: string } = { owner, repo, path };
  if (ref) params.ref = ref;

  const { data } = await octokit.repos.getContent(params);

  if (Array.isArray(data) || data.type !== 'file' || !('content' in data)) {
    throw new Error(`Path ${path} is not a file`);
  }

  const content = atob(data.content);
  const result: FileContent = {
    path: data.path,
    content,
    sha: data.sha,
  };

  cache.set(cacheKey, result, 60 * 1000);
  return result;
}

export async function createOrUpdateFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string,
): Promise<string> {
  const octokit = getOctokit();
  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: btoa(String.fromCodePoint(...new TextEncoder().encode(content))),
    sha,
  });

  // Invalidate cache for all refs of this file and its parent directory
  cache.removeByPrefix(`file:${owner}/${repo}/${path}:`);
  cache.remove(`dir:${owner}/${repo}:${path.split('/').slice(0, -1).join('/')}`);

  return data.content?.sha ?? '';
}

export async function listDirectory(owner: string, repo: string, path: string): Promise<Array<{ name: string; type: 'file' | 'dir'; path: string }>> {
  const cacheKey = `dir:${owner}/${repo}:${path}`;
  const cached = cache.get<Array<{ name: string; type: 'file' | 'dir'; path: string }>>(cacheKey);
  if (cached) return cached;

  const octokit = getOctokit();
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });

    if (!Array.isArray(data)) {
      throw new Error(`Path ${path} is not a directory`);
    }

    const items = data.map(item => ({
      name: item.name,
      type: (item.type === 'dir' ? 'dir' : 'file') as 'file' | 'dir',
      path: item.path,
    }));

    cache.set(cacheKey, items, 60 * 1000);
    return items;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && (err as Record<string, unknown>).status === 404) {
      return [];
    }
    throw err;
  }
}

export async function createIssue(
  owner: string,
  repo: string,
  title: string,
  body: string,
  labels?: string[],
): Promise<GitHubIssue> {
  const octokit = getOctokit();
  const { data } = await octokit.issues.create({
    owner,
    repo,
    title,
    body,
    labels,
  });

  return {
    number: data.number,
    title: data.title,
    body: data.body ?? '',
    state: data.state as 'open' | 'closed',
    labels: data.labels.map(l => (typeof l === 'string' ? l : l.name ?? '')),
    url: data.html_url,
    createdAt: data.created_at,
  };
}

export async function listIssues(owner: string, repo: string, labels?: string[]): Promise<GitHubIssue[]> {
  const octokit = getOctokit();
  const params: { owner: string; repo: string; state: 'all'; per_page: number; labels?: string } = {
    owner,
    repo,
    state: 'all',
    per_page: 100,
  };
  if (labels?.length) params.labels = labels.join(',');

  const { data } = await octokit.issues.list(params);

  return data
    .filter(i => !i.pull_request)
    .map(i => ({
      number: i.number,
      title: i.title,
      body: i.body ?? '',
      state: i.state as 'open' | 'closed',
      labels: i.labels.map(l => (typeof l === 'string' ? l : l.name ?? '')),
      url: i.html_url,
      createdAt: i.created_at,
    }));
}

export async function listPRs(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'all'): Promise<GitHubPR[]> {
  const octokit = getOctokit();
  const { data } = await octokit.pulls.list({
    owner,
    repo,
    state,
    per_page: 100,
  });

  return data.map(pr => ({
    number: pr.number,
    title: pr.title,
    body: pr.body ?? '',
    state: pr.merged_at ? 'merged' : (pr.state as 'open' | 'closed'),
    labels: pr.labels.map(l => l.name ?? ''),
    url: pr.html_url,
    headBranch: pr.head.ref,
    merged: !!pr.merged_at,
    createdAt: pr.created_at,
  }));
}

export async function getRepo(owner: string, repo: string): Promise<GitHubRepo> {
  const octokit = getOctokit();
  const { data } = await octokit.repos.get({ owner, repo });
  return {
    owner: data.owner.login,
    name: data.name,
    fullName: data.full_name,
    defaultBranch: data.default_branch,
    private: data.private,
    url: data.html_url,
  };
}
