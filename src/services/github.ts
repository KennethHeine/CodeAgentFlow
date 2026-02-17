import { Octokit } from '@octokit/rest';
import type { GitHubUser, GitHubRepo, GitHubContent } from '../types';

let octokit: Octokit | null = null;

/**
 * Initialize the Octokit client with a PAT.
 */
export function initGitHubClient(pat: string): void {
  octokit = new Octokit({ auth: pat });
}

/**
 * Get the current Octokit instance.
 */
export function getClient(): Octokit {
  if (!octokit) {
    throw new Error('GitHub client not initialized. Please provide a PAT.');
  }
  return octokit;
}

/**
 * Verify the PAT by fetching the authenticated user.
 */
export async function verifyPat(): Promise<GitHubUser> {
  const client = getClient();
  const { data } = await client.users.getAuthenticated();
  return {
    login: data.login,
    avatar_url: data.avatar_url,
    name: data.name ?? null,
    html_url: data.html_url,
  };
}

/**
 * List repos for the authenticated user.
 */
export async function listRepos(): Promise<GitHubRepo[]> {
  const client = getClient();
  const { data } = await client.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100,
  });
  return data.map((r) => ({
    name: r.name,
    full_name: r.full_name,
    html_url: r.html_url,
    description: r.description ?? null,
    private: r.private,
    default_branch: r.default_branch,
  }));
}

/**
 * Get contents of a path in a repo (file or directory).
 */
export async function getContents(
  owner: string,
  repo: string,
  path: string
): Promise<GitHubContent[]> {
  const client = getClient();
  try {
    const { data } = await client.repos.getContent({ owner, repo, path });
    if (Array.isArray(data)) {
      return data.map((item) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        type: item.type as 'file' | 'dir',
        html_url: item.html_url ?? '',
        download_url: item.download_url ?? undefined,
      }));
    }
    // Single file
    return [
      {
        name: data.name,
        path: data.path,
        sha: data.sha,
        type: data.type as 'file' | 'dir',
        content: 'content' in data && data.content
          ? new TextDecoder().decode(Uint8Array.from(atob(data.content.replace(/\n/g, '')), (c) => c.charCodeAt(0)))
          : undefined,
        html_url: data.html_url ?? '',
        download_url: 'download_url' in data ? (data.download_url ?? undefined) : undefined,
      },
    ];
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 404) {
      return [];
    }
    throw err;
  }
}

/**
 * Get file content as string.
 */
export async function getFileContent(
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  const contents = await getContents(owner, repo, path);
  if (contents.length === 0) return null;
  return contents[0].content ?? null;
}

/**
 * Create or update a file in a repo.
 */
export async function createOrUpdateFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const client = getClient();
  await client.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: btoa(Array.from(new TextEncoder().encode(content), (b) => String.fromCharCode(b)).join('')),
    sha,
  });
}

/**
 * Check if a repo exists and the user has access.
 */
export async function repoExists(owner: string, repo: string): Promise<boolean> {
  const client = getClient();
  try {
    await client.repos.get({ owner, repo });
    return true;
  } catch {
    return false;
  }
}
