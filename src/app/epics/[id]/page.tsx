'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Nav } from '@/components/nav';
import { StateBadge } from '@/components/state-badge';
import { useGitHubConfig } from '@/lib/use-store';
import { createGitHubClient } from '@/lib/github';
import { parseEpicMarkdown, generateEpicMarkdown } from '@/lib/epic-parser';
import type { ParsedTask } from '@/lib/epic-parser';
import { deriveTaskState } from '@/lib/state-machine';
import type { TaskState } from '@/lib/types';
import Link from 'next/link';

interface TaskWithState extends ParsedTask {
  state: TaskState;
  issueUrl?: string;
  prUrl?: string;
}

export default function EpicDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [config] = useGitHubConfig();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tasks, setTasks] = useState<TaskWithState[]>([]);
  const [sha, setSha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add task form
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskRepo, setNewTaskRepo] = useState('');
  const [saving, setSaving] = useState(false);

  const epicId = params.id;

  const loadEpic = useCallback(async () => {
    if (!config || !epicId) return;
    setLoading(true);
    setError(null);

    try {
      const client = createGitHubClient(config.token);
      const [owner, repo] = config.epicRepo.split('/');
      const path = `epics/${epicId}.md`;

      const { content, sha: fileSha } = await client.getFileContent(owner, repo, path);
      setSha(fileSha);

      const parsed = parseEpicMarkdown(content);
      setTitle(parsed.title);
      setDescription(parsed.description);

      // Derive state for each task from GitHub
      const tasksWithState: TaskWithState[] = [];
      for (const task of parsed.tasks) {
        let state: TaskState = 'PLANNED';
        let issueUrl: string | undefined;
        let prUrl: string | undefined;

        if (task.targetRepo) {
          const [tOwner, tRepo] = task.targetRepo.split('/');

          if (task.issueNumber && tOwner && tRepo) {
            try {
              const issue = await client.getIssue(tOwner, tRepo, task.issueNumber);
              issueUrl = issue.html_url;

              if (task.prNumber) {
                try {
                  const pr = await client.getPR(tOwner, tRepo, task.prNumber);
                  prUrl = pr.html_url;
                  let checks;
                  try {
                    checks = await client.getCheckRuns(tOwner, tRepo, pr.head.sha);
                  } catch {
                    checks = undefined;
                  }
                  state = deriveTaskState(issue, pr, checks);
                } catch {
                  state = deriveTaskState(issue);
                }
              } else {
                state = deriveTaskState(issue);
              }
            } catch {
              // Issue doesn't exist or no access
              state = 'PLANNED';
            }
          } else if (task.prNumber && tOwner && tRepo) {
            try {
              const pr = await client.getPR(tOwner, tRepo, task.prNumber);
              prUrl = pr.html_url;
              let checks;
              try {
                checks = await client.getCheckRuns(tOwner, tRepo, pr.head.sha);
              } catch {
                checks = undefined;
              }
              state = deriveTaskState(undefined, pr, checks);
            } catch {
              state = 'PLANNED';
            }
          }
        }

        tasksWithState.push({ ...task, state, issueUrl, prUrl });
      }

      setTasks(tasksWithState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load epic');
    } finally {
      setLoading(false);
    }
  }, [config, epicId]);

  useEffect(() => {
    loadEpic();
  }, [loadEpic]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !newTaskTitle.trim() || !newTaskRepo.trim()) return;

    setSaving(true);
    try {
      const client = createGitHubClient(config.token);
      const [owner, repo] = config.epicRepo.split('/');
      const path = `epics/${epicId}.md`;

      const allTasks: ParsedTask[] = [
        ...tasks.map((t) => ({
          title: t.title,
          description: t.description,
          targetRepo: t.targetRepo,
          issueNumber: t.issueNumber,
          prNumber: t.prNumber,
        })),
        {
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim(),
          targetRepo: newTaskRepo.trim(),
        },
      ];

      const content = generateEpicMarkdown(title, description, allTasks);
      const result = await client.createOrUpdateFile(
        owner, repo, path, content,
        `Add task: ${newTaskTitle.trim()}`,
        sha,
      );
      setSha(result.content.sha);

      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskRepo('');
      setShowAddTask(false);
      await loadEpic();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!config || !confirm('Delete this epic? This cannot be undone.')) return;

    try {
      const client = createGitHubClient(config.token);
      const [owner, repo] = config.epicRepo.split('/');
      const path = `epics/${epicId}.md`;
      await client.deleteFile(owner, repo, path, sha, `Delete epic: ${title}`);
      router.push('/epics');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete epic');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-2">
          <Link
            href="/epics"
            className="text-sm text-zinc-500 hover:text-foreground"
          >
            ← Back to Epics
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-sm text-zinc-500">Loading epic…</div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                {description && (
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">{description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={loadEpic}
                  className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Refresh
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Task list */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Tasks ({tasks.length})
              </h2>
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Add Task
              </button>
            </div>

            {showAddTask && (
              <form onSubmit={handleAddTask} className="mb-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="task-title" className="mb-1 block text-sm font-medium">
                      Task Title
                    </label>
                    <input
                      id="task-title"
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Implement feature X"
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="task-repo" className="mb-1 block text-sm font-medium">
                      Target Repository
                    </label>
                    <input
                      id="task-repo"
                      type="text"
                      value={newTaskRepo}
                      onChange={(e) => setNewTaskRepo(e.target.value)}
                      placeholder="owner/repo"
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="task-desc" className="mb-1 block text-sm font-medium">
                      Description
                    </label>
                    <textarea
                      id="task-desc"
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      placeholder="What needs to be done?"
                      rows={2}
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                    >
                      {saving ? 'Adding…' : 'Add Task'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddTask(false)}
                      className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {tasks.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
                <p className="text-sm text-zinc-500">No tasks yet. Add a task to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{task.title}</h3>
                          <StateBadge state={task.state} />
                        </div>
                        {task.description && (
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            {task.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
                          <span>📁 {task.targetRepo}</span>
                          {task.issueNumber != null && (
                            <a
                              href={task.issueUrl ?? `https://github.com/${task.targetRepo}/issues/${task.issueNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-foreground"
                            >
                              Issue #{task.issueNumber}
                            </a>
                          )}
                          {task.prNumber != null && (
                            <a
                              href={task.prUrl ?? `https://github.com/${task.targetRepo}/pull/${task.prNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-foreground"
                            >
                              PR #{task.prNumber}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
