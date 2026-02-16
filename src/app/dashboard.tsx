'use client';

import { useGitHubConfig } from '@/lib/use-store';
import { Nav } from '@/components/nav';
import { EmptyState } from '@/components/empty-state';
import { StateBadge } from '@/components/state-badge';
import { useEffect, useState, useCallback } from 'react';
import { createGitHubClient } from '@/lib/github';
import { parseEpicMarkdown } from '@/lib/epic-parser';
import type { TaskState, RepoContent } from '@/lib/types';
import { deriveTaskState } from '@/lib/state-machine';
import Link from 'next/link';

interface EpicSummary {
  id: string;
  title: string;
  path: string;
  taskCount: number;
  stateCounts: Partial<Record<TaskState, number>>;
}

export default function Dashboard() {
  const [config] = useGitHubConfig();
  const [epics, setEpics] = useState<EpicSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ login: string } | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    setError(null);
    try {
      const client = createGitHubClient(config.token);
      const [owner, repo] = config.epicRepo.split('/');

      // Get user info
      const userInfo = await client.validateToken();
      setUser(userInfo);

      // Get epics directory
      let files: RepoContent[];
      try {
        const contents = await client.getRepoContents(owner, repo, 'epics');
        files = (Array.isArray(contents) ? contents : [contents]).filter(
          (f) => f.type === 'file' && f.name.endsWith('.md'),
        );
      } catch {
        files = [];
      }

      // Parse each epic
      const summaries: EpicSummary[] = [];
      for (const file of files) {
        try {
          const { content } = await client.getFileContent(owner, repo, file.path);
          const parsed = parseEpicMarkdown(content);
          const stateCounts: Partial<Record<TaskState, number>> = {};

          // For the dashboard, we show basic task counts
          // Detailed state derivation happens in epic detail view
          for (const task of parsed.tasks) {
            // Quick state approximation for dashboard
            let state: TaskState = 'PLANNED';
            if (task.prNumber) {
              try {
                const pr = await client.getPR(
                  ...task.targetRepo.split('/') as [string, string],
                  task.prNumber,
                );
                const issue = task.issueNumber
                  ? await client.getIssue(
                      ...task.targetRepo.split('/') as [string, string],
                      task.issueNumber,
                    )
                  : undefined;
                let checks;
                try {
                  checks = await client.getCheckRuns(
                    ...task.targetRepo.split('/') as [string, string],
                    pr.head.sha,
                  );
                } catch {
                  checks = undefined;
                }
                state = deriveTaskState(issue, pr, checks);
              } catch {
                state = 'PLANNED';
              }
            } else if (task.issueNumber) {
              state = 'RUNNING';
            }
            stateCounts[state] = (stateCounts[state] ?? 0) + 1;
          }

          summaries.push({
            id: file.name.replace(/\.md$/, ''),
            title: parsed.title || file.name.replace(/\.md$/, ''),
            path: file.path,
            taskCount: parsed.tasks.length,
            stateCounts,
          });
        } catch {
          // Skip unparseable files
        }
      }
      setEpics(summaries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const ALL_STATES: TaskState[] = [
    'PLANNED', 'RUNNING', 'PR_READY', 'VALIDATING',
    'APPROVAL_PENDING', 'FIXING', 'MERGED', 'DONE', 'BLOCKED',
  ];

  const totalTasks = epics.reduce((s, e) => s + e.taskCount, 0);
  const globalStateCounts: Partial<Record<TaskState, number>> = {};
  for (const epic of epics) {
    for (const [state, count] of Object.entries(epic.stateCounts)) {
      globalStateCounts[state as TaskState] =
        (globalStateCounts[state as TaskState] ?? 0) + count;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            {user && (
              <p className="text-sm text-zinc-500">
                Signed in as <span className="font-medium">{user.login}</span>
              </p>
            )}
          </div>
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {!config ? (
          <EmptyState
            title="Welcome to CodeAgentFlow"
            description="Connect your GitHub account to get started. You'll need a Personal Access Token and an Epic repository."
            actionLabel="Go to Settings"
            actionHref="/settings"
          />
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-sm text-zinc-500">Loading dashboard…</div>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="text-2xl font-bold">{epics.length}</div>
                <div className="text-sm text-zinc-500">Epics</div>
              </div>
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="text-2xl font-bold">{totalTasks}</div>
                <div className="text-sm text-zinc-500">Total Tasks</div>
              </div>
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="text-2xl font-bold">
                  {(globalStateCounts['DONE'] ?? 0) + (globalStateCounts['MERGED'] ?? 0)}
                </div>
                <div className="text-sm text-zinc-500">Completed</div>
              </div>
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="text-2xl font-bold">
                  {(globalStateCounts['RUNNING'] ?? 0) +
                    (globalStateCounts['PR_READY'] ?? 0) +
                    (globalStateCounts['VALIDATING'] ?? 0)}
                </div>
                <div className="text-sm text-zinc-500">In Progress</div>
              </div>
            </div>

            {/* State distribution */}
            {totalTasks > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 text-sm font-medium text-zinc-500">Task State Distribution</h2>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATES.filter((s) => globalStateCounts[s]).map((state) => (
                    <div key={state} className="flex items-center gap-1.5">
                      <StateBadge state={state} />
                      <span className="text-sm font-medium">{globalStateCounts[state]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Epic list */}
            {epics.length === 0 ? (
              <EmptyState
                title="No epics yet"
                description="Create your first epic to start orchestrating work."
                actionLabel="Create Epic"
                actionHref="/epics"
              />
            ) : (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Epics</h2>
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
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ALL_STATES.filter((s) => epic.stateCounts[s]).map((state) => (
                        <div key={state} className="flex items-center gap-1">
                          <StateBadge state={state} />
                          <span className="text-xs text-zinc-500">{epic.stateCounts[state]}</span>
                        </div>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
