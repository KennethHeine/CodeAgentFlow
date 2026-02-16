export interface ParsedTask {
  title: string;
  description: string;
  targetRepo: string;
  issueNumber?: number;
  prNumber?: number;
}

interface ParsedEpic {
  title: string;
  description: string;
  tasks: ParsedTask[];
}

/**
 * Parse an epic Markdown file into structured data.
 *
 * Expected format:
 * ```
 * # Epic Title
 *
 * Description of the epic.
 *
 * ## Tasks
 *
 * ### Task 1 Title
 * - **Target Repo:** owner/repo
 * - **Issue:** #123
 * - **PR:** #456
 *
 * Task description here.
 * ```
 */
export function parseEpicMarkdown(content: string): ParsedEpic {
  const lines = content.split('\n');

  let title = '';
  const descriptionLines: string[] = [];
  const tasks: ParsedTask[] = [];

  let inDescription = false;
  let inTasks = false;
  let currentTask: ParsedTask | null = null;
  let currentTaskDescLines: string[] = [];

  for (const line of lines) {
    // Epic title (# heading)
    if (!title && /^# /.test(line)) {
      title = line.replace(/^# /, '').trim();
      inDescription = true;
      continue;
    }

    // Tasks section heading
    if (/^## Tasks\s*$/i.test(line)) {
      inDescription = false;
      inTasks = true;
      continue;
    }

    // Other ## heading ends description too
    if (/^## /.test(line) && !inTasks) {
      inDescription = false;
      continue;
    }

    if (inDescription) {
      descriptionLines.push(line);
      continue;
    }

    if (!inTasks) continue;

    // New task heading
    if (/^### /.test(line)) {
      // Flush previous task
      if (currentTask) {
        currentTask.description = currentTaskDescLines.join('\n').trim();
        tasks.push(currentTask);
      }
      currentTask = {
        title: line.replace(/^### /, '').trim(),
        description: '',
        targetRepo: '',
      };
      currentTaskDescLines = [];
      continue;
    }

    if (!currentTask) continue;

    // Metadata lines
    const repoMatch = line.match(/^- \*\*Target Repo:\*\*\s*(.+)/i);
    if (repoMatch) {
      currentTask.targetRepo = repoMatch[1].trim();
      continue;
    }

    const issueMatch = line.match(/^- \*\*Issue:\*\*\s*#(\d+)/i);
    if (issueMatch) {
      currentTask.issueNumber = parseInt(issueMatch[1], 10);
      continue;
    }

    const prMatch = line.match(/^- \*\*PR:\*\*\s*#(\d+)/i);
    if (prMatch) {
      currentTask.prNumber = parseInt(prMatch[1], 10);
      continue;
    }

    // Task description lines
    currentTaskDescLines.push(line);
  }

  // Flush last task
  if (currentTask) {
    currentTask.description = currentTaskDescLines.join('\n').trim();
    tasks.push(currentTask);
  }

  return {
    title,
    description: descriptionLines.join('\n').trim(),
    tasks,
  };
}

/**
 * Generate a Markdown string from structured epic data.
 */
export function generateEpicMarkdown(
  title: string,
  description: string,
  tasks: ParsedTask[],
): string {
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push('');
  if (description) {
    lines.push(description);
    lines.push('');
  }

  lines.push('## Tasks');
  lines.push('');

  for (const task of tasks) {
    lines.push(`### ${task.title}`);
    lines.push(`- **Target Repo:** ${task.targetRepo}`);
    if (task.issueNumber != null) {
      lines.push(`- **Issue:** #${task.issueNumber}`);
    }
    if (task.prNumber != null) {
      lines.push(`- **PR:** #${task.prNumber}`);
    }
    lines.push('');
    if (task.description) {
      lines.push(task.description);
      lines.push('');
    }
  }

  return lines.join('\n');
}
