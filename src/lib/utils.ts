export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export function padTaskNumber(n: number): string {
  return String(n).padStart(3, '0');
}

export function parseTaskFilename(filename: string): { number: number; slug: string } | null {
  const match = filename.match(/^(\d{3})-(.+)\.md$/);
  if (!match) return null;
  return { number: parseInt(match[1], 10), slug: match[2] };
}

export function buildTaskFilename(number: number, slug: string): string {
  return `${padTaskNumber(number)}-${slugify(slug)}.md`;
}

export function splitRepoFullName(fullName: string): { owner: string; repo: string } | null {
  const parts = fullName.split('/');
  if (parts.length !== 2) return null;
  return { owner: parts[0], repo: parts[1] };
}

export function epicStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Draft',
    planning: 'Planning',
    ready: 'Ready',
    in_progress: 'In Progress',
    completed: 'Completed',
    archived: 'Archived',
  };
  return labels[status] ?? status;
}

export function taskStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    issue_created: 'Issue Created',
    agent_running: 'Agent Running',
    pr_open: 'PR Open',
    pr_review: 'In Review',
    pr_merged: 'Merged',
    failed: 'Failed',
  };
  return labels[status] ?? status;
}

export function taskStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'text-gray-400 bg-gray-400/10',
    issue_created: 'text-blue-400 bg-blue-400/10',
    agent_running: 'text-yellow-400 bg-yellow-400/10',
    pr_open: 'text-purple-400 bg-purple-400/10',
    pr_review: 'text-orange-400 bg-orange-400/10',
    pr_merged: 'text-green-400 bg-green-400/10',
    failed: 'text-red-400 bg-red-400/10',
  };
  return colors[status] ?? 'text-gray-400 bg-gray-400/10';
}

export function epicStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'text-gray-400 bg-gray-400/10',
    planning: 'text-blue-400 bg-blue-400/10',
    ready: 'text-cyan-400 bg-cyan-400/10',
    in_progress: 'text-yellow-400 bg-yellow-400/10',
    completed: 'text-green-400 bg-green-400/10',
    archived: 'text-gray-500 bg-gray-500/10',
  };
  return colors[status] ?? 'text-gray-400 bg-gray-400/10';
}
