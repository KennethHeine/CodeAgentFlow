import { useState, useEffect, useCallback } from 'react';
import { getContents, getFileContent, createOrUpdateFile } from '../services/github';
import { slugify, taskFilename, renderGoalMd, renderRequirementsMd, renderPlanMd, renderTaskMd, parseTaskMd } from '../utils';
import type { Epic, EpicCreationState, TaskDraft } from '../types';

const EPICS_BASE_PATH = 'epics';

export function useEpics(owner: string | null, repo: string | null) {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEpics = useCallback(async () => {
    if (!owner || !repo) return;
    setLoading(true);
    setError(null);
    try {
      const contents = await getContents(owner, repo, EPICS_BASE_PATH);
      const dirs = contents.filter((c) => c.type === 'dir');
      const epicList: Epic[] = dirs.map((d) => ({
        name: d.name,
        slug: d.name,
        path: d.path,
        tasks: [],
      }));
      setEpics(epicList);
    } catch (err) {
      console.error('Failed to load epics:', err);
      setError('Failed to load epics');
      setEpics([]);
    } finally {
      setLoading(false);
    }
  }, [owner, repo]);

  useEffect(() => {
    loadEpics();
  }, [loadEpics]);

  const loadEpicDetails = useCallback(
    async (epicSlug: string): Promise<Epic | null> => {
      if (!owner || !repo) return null;
      const basePath = `${EPICS_BASE_PATH}/${epicSlug}`;

      try {
        const [goal, requirements, plan] = await Promise.all([
          getFileContent(owner, repo, `${basePath}/goal.md`),
          getFileContent(owner, repo, `${basePath}/requirements.md`),
          getFileContent(owner, repo, `${basePath}/plan.md`),
        ]);

        // Load tasks
        const taskContents = await getContents(owner, repo, `${basePath}/tasks`).catch(() => []);
        const taskFiles = taskContents.filter((c) => c.type === 'file' && c.name.endsWith('.md'));

        const tasks = await Promise.all(
          taskFiles.map(async (tf) => {
            const content = await getFileContent(owner, repo, tf.path);
            const parsed = parseTaskMd(content || '', tf.name);
            return {
              id: tf.name,
              slug: tf.name.replace(/^\d{3}-/, '').replace(/\.md$/, ''),
              title: parsed.title || tf.name,
              filename: tf.name,
              content: content || '',
              subtasks: parsed.subtasks || [],
              status: 'pending' as const,
            };
          })
        );

        return {
          name: epicSlug,
          slug: epicSlug,
          path: basePath,
          goal: goal || undefined,
          requirements: requirements || undefined,
          plan: plan || undefined,
          tasks,
        };
      } catch {
        return null;
      }
    },
    [owner, repo]
  );

  const createEpic = useCallback(
    async (state: EpicCreationState) => {
      if (!owner || !repo) throw new Error('No repo selected');
      setLoading(true);
      setError(null);

      try {
        const slug = slugify(state.name);
        const basePath = `${EPICS_BASE_PATH}/${slug}`;

        // Create goal.md
        await createOrUpdateFile(
          owner,
          repo,
          `${basePath}/goal.md`,
          renderGoalMd(state.name, state.goal),
          `epic(${slug}): add goal`
        );

        // Create requirements.md
        await createOrUpdateFile(
          owner,
          repo,
          `${basePath}/requirements.md`,
          renderRequirementsMd(state.name, state.requirements),
          `epic(${slug}): add requirements`
        );

        // Create plan.md
        await createOrUpdateFile(
          owner,
          repo,
          `${basePath}/plan.md`,
          renderPlanMd(state.name, state.plan, state.tasks),
          `epic(${slug}): add plan`
        );

        // Create task files
        for (let i = 0; i < state.tasks.length; i++) {
          const task = state.tasks[i];
          const filename = taskFilename(i, task.slug || slugify(task.title));
          await createOrUpdateFile(
            owner,
            repo,
            `${basePath}/tasks/${filename}`,
            renderTaskMd(task, i),
            `epic(${slug}): add task ${i + 1}`
          );
        }

        await loadEpics();
        return slug;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create epic';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [owner, repo, loadEpics]
  );

  const addTask = useCallback(
    async (epicSlug: string, task: TaskDraft, index: number) => {
      if (!owner || !repo) throw new Error('No repo selected');
      const slug = slugify(task.title);
      const filename = taskFilename(index, task.slug || slug);
      const basePath = `${EPICS_BASE_PATH}/${epicSlug}/tasks/${filename}`;

      await createOrUpdateFile(
        owner,
        repo,
        basePath,
        renderTaskMd(task, index),
        `epic(${epicSlug}): add task ${index + 1}`
      );
    },
    [owner, repo]
  );

  return {
    epics,
    loading,
    error,
    loadEpics,
    loadEpicDetails,
    createEpic,
    addTask,
  };
}
