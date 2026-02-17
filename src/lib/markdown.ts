import type { Task, Subtask } from '@/types';

export function generateGoalMarkdown(epicName: string, goalText: string): string {
  return `# ${epicName} - Goal

${goalText}
`;
}

export function generateRequirementsMarkdown(epicName: string, requirementsText: string): string {
  return `# ${epicName} - Requirements

${requirementsText}
`;
}

export function generatePlanMarkdown(epicName: string, planText: string): string {
  return `# ${epicName} - Plan

${planText}
`;
}

export function generateTaskMarkdown(task: Pick<Task, 'title' | 'content' | 'subtasks'>): string {
  let md = `# ${task.title}\n\n${task.content}\n`;

  if (task.subtasks.length > 0) {
    md += '\n## Subtasks\n\n';
    for (const subtask of task.subtasks) {
      const check = subtask.completed ? 'x' : ' ';
      const typeTag = subtask.type === 'research' ? '[Research]' : '[Work]';
      md += `- [${check}] ${typeTag} **${subtask.title}**\n`;
      if (subtask.description) {
        md += `  ${subtask.description}\n`;
      }
    }
  }

  return md;
}

export function parseTaskMarkdown(content: string): Pick<Task, 'title' | 'content' | 'subtasks'> {
  const lines = content.split('\n');
  let title = '';
  let bodyLines: string[] = [];
  const subtasks: Subtask[] = [];
  let inSubtasks = false;
  let subtaskIdx = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (i === 0 && line.startsWith('# ')) {
      title = line.replace(/^#\s+/, '').trim();
      continue;
    }

    if (line.match(/^##\s+Subtasks/i)) {
      inSubtasks = true;
      continue;
    }

    if (inSubtasks) {
      const subtaskMatch = line.match(/^-\s+\[([ xX])\]\s+(?:\[(Research|Work)\]\s+)?\*\*(.+?)\*\*/);
      if (subtaskMatch) {
        subtaskIdx++;
        const completed = subtaskMatch[1].toLowerCase() === 'x';
        const type = (subtaskMatch[2]?.toLowerCase() ?? 'work') as 'research' | 'work';
        const subtaskTitle = subtaskMatch[3];
        subtasks.push({
          id: `subtask-${subtaskIdx}`,
          title: subtaskTitle,
          type,
          description: '',
          completed,
        });
      } else if (line.startsWith('  ') && subtasks.length > 0) {
        subtasks[subtasks.length - 1].description += line.trim() + '\n';
      }
    } else {
      bodyLines.push(line);
    }
  }

  // Trim trailing empty lines from body
  while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1].trim() === '') {
    bodyLines.pop();
  }

  // Trim descriptions
  for (const st of subtasks) {
    st.description = st.description.trim();
  }

  return {
    title,
    content: bodyLines.join('\n').trim(),
    subtasks,
  };
}

export function parseEpicPlanTasks(planContent: string): Array<{ title: string; description: string }> {
  const tasks: Array<{ title: string; description: string }> = [];
  const lines = planContent.split('\n');
  let currentTask: { title: string; description: string } | null = null;

  for (const line of lines) {
    // Match numbered task lines: "1. **Task title**" or "1. Task title"
    const taskMatch = line.match(/^\d+\.\s+(?:\*\*)?(.+?)(?:\*\*)?\s*$/);
    if (taskMatch) {
      if (currentTask) {
        tasks.push(currentTask);
      }
      currentTask = {
        title: taskMatch[1].replace(/\*\*/g, '').trim(),
        description: '',
      };
      continue;
    }

    // Append description lines to current task
    if (currentTask && line.trim()) {
      if (line.startsWith('   ') || line.startsWith('\t')) {
        currentTask.description += line.trim() + '\n';
      }
    }
  }

  if (currentTask) {
    tasks.push(currentTask);
  }

  return tasks.map(t => ({
    ...t,
    description: t.description.trim(),
  }));
}
