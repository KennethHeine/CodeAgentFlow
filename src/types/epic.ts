export interface Epic {
  name: string;
  slug: string;
  path: string;
  goal?: string;
  requirements?: string;
  plan?: string;
  tasks: Task[];
  createdAt?: string;
}

export interface Task {
  id: string;
  slug: string;
  title: string;
  filename: string;
  content: string;
  subtasks: Subtask[];
  status: TaskStatus;
  issueNumber?: number;
  prNumber?: number;
}

export interface Subtask {
  title: string;
  type: 'research' | 'work';
  description: string;
  completed: boolean;
}

export type TaskStatus = 'pending' | 'in-progress' | 'review' | 'done';

export type EpicStep = 'name' | 'goal' | 'requirements' | 'plan' | 'tasks';

export interface EpicCreationState {
  step: EpicStep;
  name: string;
  goal: string;
  requirements: string;
  plan: string;
  tasks: TaskDraft[];
}

export interface TaskDraft {
  title: string;
  slug: string;
  subtasks: SubtaskDraft[];
}

export interface SubtaskDraft {
  title: string;
  type: 'research' | 'work';
  description: string;
}
