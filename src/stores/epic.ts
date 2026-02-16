import { create } from 'zustand';
import type { Epic, EpicStep, Task } from '@/types';
import { slugify, padTaskNumber, splitRepoFullName, buildTaskFilename } from '@/lib/utils';
import { generateGoalMarkdown, generateRequirementsMarkdown, generatePlanMarkdown, generateTaskMarkdown, parseTaskMarkdown } from '@/lib/markdown';
import * as github from '@/services/github';
import { cache } from '@/services/cache';

interface EpicState {
  epics: Epic[];
  currentEpic: Epic | null;
  isLoading: boolean;
  error: string | null;
  epicRepoFullName: string;

  setEpicRepo: (fullName: string) => void;
  loadEpics: () => Promise<void>;
  loadEpicDetail: (epicId: string) => Promise<void>;
  createEpic: (name: string) => Promise<Epic>;
  saveEpicStep: (epicId: string, step: EpicStep, content: string) => Promise<void>;
  setCurrentEpic: (epic: Epic | null) => void;
  updateEpicStatus: (epicId: string, status: Epic['status']) => void;
}

export const useEpicStore = create<EpicState>((set, get) => ({
  epics: [],
  currentEpic: null,
  isLoading: false,
  error: null,
  epicRepoFullName: localStorage.getItem('caf:epicRepo') ?? '',

  setEpicRepo: (fullName: string) => {
    localStorage.setItem('caf:epicRepo', fullName);
    set({ epicRepoFullName: fullName, epics: [] });
  },

  loadEpics: async () => {
    const { epicRepoFullName } = get();
    if (!epicRepoFullName) return;

    const repo = splitRepoFullName(epicRepoFullName);
    if (!repo) return;

    set({ isLoading: true, error: null });

    try {
      const dirs = await github.listDirectory(repo.owner, repo.repo, 'epics');
      const epicDirs = dirs.filter(d => d.type === 'dir');

      const epics: Epic[] = epicDirs.map(d => ({
        id: d.name,
        name: d.name.replace(/-/g, ' '),
        slug: d.name,
        status: 'draft' as const,
        repoFullName: epicRepoFullName,
        path: d.path,
        tasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      // Try to load status from each epic's goal.md to determine completeness
      for (const epic of epics) {
        try {
          await github.getFileContent(repo.owner, repo.repo, `${epic.path}/goal.md`);
          epic.status = 'planning';

          try {
            await github.getFileContent(repo.owner, repo.repo, `${epic.path}/requirements.md`);
            try {
              await github.getFileContent(repo.owner, repo.repo, `${epic.path}/plan.md`);
              epic.status = 'ready';

              const taskFiles = await github.listDirectory(repo.owner, repo.repo, `${epic.path}/tasks`);
              if (taskFiles.length > 0) {
                epic.status = 'in_progress';
              }
            } catch {
              // No plan yet
            }
          } catch {
            // No requirements yet
          }
        } catch {
          // No goal yet, stays draft
        }
      }

      set({ epics, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load epics';
      set({ error: message, isLoading: false });
    }
  },

  loadEpicDetail: async (epicId: string) => {
    const { epicRepoFullName } = get();
    const repo = splitRepoFullName(epicRepoFullName);
    if (!repo) return;

    set({ isLoading: true, error: null });

    try {
      const basePath = `epics/${epicId}`;
      let goal: string | undefined;
      let requirements: string | undefined;
      let plan: string | undefined;

      try {
        const goalFile = await github.getFileContent(repo.owner, repo.repo, `${basePath}/goal.md`);
        goal = goalFile.content;
      } catch { /* not yet created */ }

      try {
        const reqFile = await github.getFileContent(repo.owner, repo.repo, `${basePath}/requirements.md`);
        requirements = reqFile.content;
      } catch { /* not yet created */ }

      try {
        const planFile = await github.getFileContent(repo.owner, repo.repo, `${basePath}/plan.md`);
        plan = planFile.content;
      } catch { /* not yet created */ }

      // Load tasks
      const tasks: Task[] = [];
      try {
        const taskFiles = await github.listDirectory(repo.owner, repo.repo, `${basePath}/tasks`);
        const mdFiles = taskFiles.filter(f => f.name.endsWith('.md')).sort((a, b) => a.name.localeCompare(b.name));

        for (const file of mdFiles) {
          const fileContent = await github.getFileContent(repo.owner, repo.repo, file.path);
          const parsed = parseTaskMarkdown(fileContent.content);
          const numMatch = file.name.match(/^(\d{3})/);
          const taskNum = numMatch ? parseInt(numMatch[1], 10) : 0;

          tasks.push({
            id: file.name.replace('.md', ''),
            number: taskNum,
            slug: file.name.replace(/^\d{3}-/, '').replace('.md', ''),
            title: parsed.title,
            status: 'pending',
            content: parsed.content,
            subtasks: parsed.subtasks,
          });
        }
      } catch { /* no tasks dir yet */ }

      let status: Epic['status'] = 'draft';
      if (goal) status = 'planning';
      if (goal && requirements && plan) status = 'ready';
      if (tasks.length > 0) status = 'in_progress';

      const epic: Epic = {
        id: epicId,
        name: epicId.replace(/-/g, ' '),
        slug: epicId,
        status,
        repoFullName: epicRepoFullName,
        path: basePath,
        goal,
        requirements,
        plan,
        tasks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set({ currentEpic: epic, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load epic';
      set({ error: message, isLoading: false });
    }
  },

  createEpic: async (name: string) => {
    const { epicRepoFullName } = get();
    const repo = splitRepoFullName(epicRepoFullName);
    if (!repo) throw new Error('Epic repo not configured');

    const slug = slugify(name);
    const path = `epics/${slug}`;

    // Create goal.md as initial file to scaffold the directory
    await github.createOrUpdateFile(
      repo.owner,
      repo.repo,
      `${path}/goal.md`,
      `# ${name} - Goal\n\n_Describe what success looks like for this epic._\n`,
      `chore: scaffold epic "${name}"`,
    );

    // Invalidate cache
    cache.remove(`dir:${repo.owner}/${repo.repo}:epics`);

    const epic: Epic = {
      id: slug,
      name,
      slug,
      status: 'draft',
      repoFullName: epicRepoFullName,
      path,
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set(state => ({ epics: [...state.epics, epic], currentEpic: epic }));
    return epic;
  },

  saveEpicStep: async (epicId: string, step: EpicStep, content: string) => {
    const { epicRepoFullName } = get();
    const repo = splitRepoFullName(epicRepoFullName);
    if (!repo) throw new Error('Epic repo not configured');

    const basePath = `epics/${epicId}`;
    const epicName = epicId.replace(/-/g, ' ');

    let filePath: string;
    let fileContent: string;
    let commitMsg: string;

    switch (step) {
      case 'goal':
        filePath = `${basePath}/goal.md`;
        fileContent = generateGoalMarkdown(epicName, content);
        commitMsg = `docs: update goal for "${epicName}"`;
        break;
      case 'requirements':
        filePath = `${basePath}/requirements.md`;
        fileContent = generateRequirementsMarkdown(epicName, content);
        commitMsg = `docs: update requirements for "${epicName}"`;
        break;
      case 'plan':
        filePath = `${basePath}/plan.md`;
        fileContent = generatePlanMarkdown(epicName, content);
        commitMsg = `docs: update plan for "${epicName}"`;
        break;
      case 'tasks': {
        // Parse tasks from content and create individual files
        const taskLines = content.split('\n---\n');
        for (let i = 0; i < taskLines.length; i++) {
          const taskContent = taskLines[i].trim();
          if (!taskContent) continue;

          const parsed = parseTaskMarkdown(taskContent);
          const taskSlug = slugify(parsed.title || `task-${i + 1}`);
          const taskPath = `${basePath}/tasks/${buildTaskFilename(i + 1, taskSlug)}`;
          const taskMd = generateTaskMarkdown(parsed);

          let sha: string | undefined;
          try {
            const existing = await github.getFileContent(repo.owner, repo.repo, taskPath);
            sha = existing.sha;
          } catch { /* new file */ }

          await github.createOrUpdateFile(
            repo.owner,
            repo.repo,
            taskPath,
            taskMd,
            `docs: update task ${padTaskNumber(i + 1)} for "${epicName}"`,
            sha,
          );
        }
        // Reload epic detail
        await get().loadEpicDetail(epicId);
        return;
      }
    }

    // For non-task steps, check if file exists for sha
    let sha: string | undefined;
    try {
      const existing = await github.getFileContent(repo.owner, repo.repo, filePath);
      sha = existing.sha;
    } catch { /* new file */ }

    await github.createOrUpdateFile(repo.owner, repo.repo, filePath, fileContent, commitMsg, sha);

    // Update current epic
    set(state => {
      if (!state.currentEpic || state.currentEpic.id !== epicId) return {};
      return {
        currentEpic: {
          ...state.currentEpic,
          [step]: content,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },

  setCurrentEpic: (epic) => set({ currentEpic: epic }),

  updateEpicStatus: (epicId, status) => {
    set(state => ({
      epics: state.epics.map(e => e.id === epicId ? { ...e, status } : e),
      currentEpic: state.currentEpic?.id === epicId
        ? { ...state.currentEpic, status }
        : state.currentEpic,
    }));
  },
}));
