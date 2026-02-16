const apiBase = 'https://api.github.com';

function toBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export class GitHubClient {
  constructor(token) {
    this.token = token;
  }

  async request(path, options = {}) {
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub request failed (${response.status}): ${body}`);
    }

    return response.status === 204 ? null : response.json();
  }

  async getContent(owner, repo, path, branch) {
    try {
      return await this.request(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`);
    } catch (error) {
      if (String(error.message).includes('(404)')) {
        return null;
      }
      throw error;
    }
  }

  async putContent({ owner, repo, path, content, message, branch }) {
    const existing = await this.getContent(owner, repo, path, branch);
    const payload = {
      message,
      content: toBase64(content),
      branch,
      ...(existing?.sha ? { sha: existing.sha } : {}),
    };

    return this.request(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}
