'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Nav } from '@/components/nav';
import { EmptyState } from '@/components/empty-state';
import { useGitHubConfig } from '@/lib/use-store';
import { createGitHubClient } from '@/lib/github';
import { parseEpicMarkdown, generateEpicMarkdown } from '@/lib/epic-parser';
import type { ParsedTask } from '@/lib/epic-parser';
import type { RepoContent } from '@/lib/types';

interface EpicListItem {
  id: string;
  title: string;
  path: string;
  taskCount: number;
}

export default function EpicsPage() {
  const [config] = useGitHubConfig();
  const [epics, setEpics] = useState<EpicListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const loadEpics = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    setError(null);
    try {
      const client = createGitHubClient(config.token);
      const [owner, repo] = config.epicRepo.split('/');

      let files: RepoContent[];
      try {
        const contents = await client.getRepoContents(owner, repo, 'epics');
        files = (Array.isArray(contents) ? contents : [contents]).filter(
          (f) => f.type === 'file' && f.name.endsWith('.md'),
        );
      } catch {
        files = [];
      }

      const items: EpicListItem[] = [];
      for (const file of files) {
        try {
          const { content } = await client.getFileContent(owner, repo, file.path);
          const parsed = parseEpicMarkdown(content);
          items.push({
            id: file.name.replace(/\.md$/, ''),
            title: parsed.title || file.name.replace(/\.md$/, ''),
            path: file.path,
            taskCount: parsed.tasks.length,
          });
        } catch {
          items.push({
            id: file.name.replace(/\.md$/, ''),
            title: file.name.replace(/\.md$/, ''),
            path: file.path,
            taskCount: 0,
          });
        }
      }
      setEpics(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load epics');
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    loadEpics();
  }, [loadEpics]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !newTitle.trim()) return;

    setCreating(true);
    try {
      const client = createGitHubClient(config.token);
      const [owner, repo] = config.epicRepo.split('/');
      const slug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const path = `epics/${slug}.md`;
      const tasks: ParsedTask[] = [];
      const content = generateEpicMarkdown(newTitle.trim(), newDesc.trim(), tasks);

      await client.createOrUpdateFile(owner, repo, path, content, `Create epic: ${newTitle.trim()}`);

      setNewTitle('');
      setNewDesc('');
      setShowCreate(false);
      await loadEpics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create epic');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Epics</h1>
          <div className="flex gap-2">
            <button
              onClick={loadEpics}
              disabled={loading}
              className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Refresh
            </button>
            {config && (
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                New Epic
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {showCreate && (
          <form onSubmit={handleCreate} className="mb-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="mb-3 text-lg font-semibold">Create New Epic</h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="epic-title" className="mb-1 block text-sm font-medium">
                  Title
                </label>
                <input
                  id="epic-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="My Epic"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  required
                />
              </div>
              <div>
                <label htmlFor="epic-desc" className="mb-1 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="epic-desc"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What is this epic about?"
                  rows={3}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  {creating ? 'Creating…' : 'Create Epic'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {!config ? (
          <EmptyState
            title="Connect GitHub"
            description="Configure your GitHub PAT and Epic repository to manage epics."
            actionLabel="Go to Settings"
            actionHref="/settings"
          />
        ) : loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-sm text-zinc-500">Loading epics…</div>
          </div>
        ) : epics.length === 0 ? (
          <EmptyState
            title="No epics found"
            description="Create your first epic to start orchestrating work across repositories."
            actionLabel="Create Epic"
            onAction={() => setShowCreate(true)}
          />
        ) : (
          <div className="space-y-3">
            {epics.map((epic) => (
              <Link
                key={epic.id}
                href={`/epics/${epic.id}`}
                className="block rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{epic.title}</h3>
                  <span className="text-sm text-zinc-500">
                    {epic.taskCount} task{epic.taskCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">{epic.path}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
