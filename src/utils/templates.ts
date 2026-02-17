import type { Task, Subtask, TaskDraft } from '../types';

/**
 * Generate goal.md content from user input.
 */
export function renderGoalMd(epicName: string, goal: string): string {
  return `# ${epicName} — Goal\n\n${goal}\n`;
}

/**
 * Generate requirements.md content from user input.
 */
export function renderRequirementsMd(epicName: string, requirements: string): string {
  return `# ${epicName} — Requirements\n\n${requirements}\n`;
}

/**
 * Generate plan.md content from user input.
 */
export function renderPlanMd(epicName: string, plan: string, tasks: TaskDraft[]): string {
  let md = `# ${epicName} — Plan\n\n${plan}\n\n## Tasks\n\n`;
  tasks.forEach((task, i) => {
    md += `${i + 1}. **${task.title}**\n`;
    task.subtasks.forEach((sub) => {
      md += `   - [${sub.type}] ${sub.title}\n`;
    });
  });
  return md;
}

/**
 * Generate a task markdown file content.
 */
export function renderTaskMd(task: TaskDraft, index: number): string {
  const num = String(index + 1).padStart(3, '0');
  let md = `# Task ${num}: ${task.title}\n\n`;

  if (task.subtasks.length > 0) {
    md += `## Subtasks\n\n`;
    task.subtasks.forEach((sub, i) => {
      md += `### ${i + 1}. [${sub.type}] ${sub.title}\n\n${sub.description}\n\n`;
    });
  }

  return md;
}

/**
 * Parse a task markdown file into structured data.
 */
export function parseTaskMd(content: string, filename: string): Partial<Task> {
  const titleMatch = content.match(/^#\s+Task\s+\d+:\s+(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : filename;

  const subtasks: Subtask[] = [];
  const subtaskRegex = /###\s+\d+\.\s+\[(research|work)\]\s+(.+?)(?:\n\n([\s\S]*?))?(?=\n###|\n##|$)/g;
  let match;
  while ((match = subtaskRegex.exec(content)) !== null) {
    subtasks.push({
      type: match[1] as 'research' | 'work',
      title: match[2].trim(),
      description: (match[3] || '').trim(),
      completed: false,
    });
  }

  return { title, subtasks };
}

/**
 * Derive task status from GitHub artifacts.
 */
export function deriveTaskStatus(task: {
  issueNumber?: number;
  prNumber?: number;
  prMerged?: boolean;
  prState?: string;
}): Task['status'] {
  if (task.prMerged) return 'done';
  if (task.prNumber && task.prState === 'open') return 'review';
  if (task.issueNumber) return 'in-progress';
  return 'pending';
}
