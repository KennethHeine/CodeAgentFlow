import type { TaskState } from '@/lib/types';

const STATE_COLORS: Record<TaskState, string> = {
  PLANNED: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  RUNNING: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  PR_READY: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  VALIDATING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  APPROVAL_PENDING: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  FIXING: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  MERGED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  BLOCKED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const STATE_LABELS: Record<TaskState, string> = {
  PLANNED: 'Planned',
  RUNNING: 'Running',
  PR_READY: 'PR Ready',
  VALIDATING: 'Validating',
  APPROVAL_PENDING: 'Awaiting Approval',
  FIXING: 'Fixing',
  MERGED: 'Merged',
  DONE: 'Done',
  BLOCKED: 'Blocked',
};

export function StateBadge({ state }: { state: TaskState }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATE_COLORS[state]}`}
    >
      {STATE_LABELS[state]}
    </span>
  );
}
