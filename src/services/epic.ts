import { GitHubClient } from './github';

export interface Epic {
  id: string;
  name: string;
  goal?: string;
  requirements?: string;
  plan?: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  slug: string;
  title: string;
  content: string;
  subtasks: Subtask[];
  order: number;
}

export interface Subtask {
  id: string;
  title: string;
  type: 'research' | 'work';
  steps: string[];
  completed: boolean;
}

export class EpicService {
  constructor(
    private github: GitHubClient,
    private owner: string,
    private repo: string
  ) {}

  /**
   * Parse epic repository structure
   */
  private parseEpicId(folderName: string): string {
    return folderName;
  }

  /**
   * List all epics in the repository
   */
  async listEpics(): Promise<Array<{ id: string; name: string }>> {
    try {
      const dirs = await this.github.listDirectory(this.owner, this.repo, 'epics');
      return dirs
        .filter((item) => item.type === 'dir')
        .map((item) => ({
          id: this.parseEpicId(item.name),
          name: item.name,
        }));
    } catch (error) {
      // epics directory doesn't exist yet
      return [];
    }
  }

  /**
   * Create a new epic folder structure
   */
  async createEpic(name: string): Promise<string> {
    const epicId = this.slugify(name);
    const basePath = `epics/${epicId}`;

    // Create placeholder files
    await this.github.createOrUpdateFile(
      this.owner,
      this.repo,
      `${basePath}/goal.md`,
      '# Goal\n\n<!-- Describe what success looks like -->\n',
      `Create epic: ${name}`
    );

    await this.github.createOrUpdateFile(
      this.owner,
      this.repo,
      `${basePath}/requirements.md`,
      '# Requirements\n\n<!-- Define constraints, non-goals, acceptance criteria -->\n',
      `Create requirements for epic: ${name}`
    );

    await this.github.createOrUpdateFile(
      this.owner,
      this.repo,
      `${basePath}/plan.md`,
      '# Plan\n\n<!-- Break down the epic into tasks -->\n',
      `Create plan for epic: ${name}`
    );

    // Create tasks directory
    await this.github.createOrUpdateFile(
      this.owner,
      this.repo,
      `${basePath}/tasks/.gitkeep`,
      '',
      `Create tasks directory for epic: ${name}`
    );

    return epicId;
  }

  /**
   * Get epic details
   */
  async getEpic(epicId: string): Promise<Epic> {
    const basePath = `epics/${epicId}`;

    const [goal, requirements, plan, taskFiles] = await Promise.all([
      this.loadFile(basePath, 'goal.md'),
      this.loadFile(basePath, 'requirements.md'),
      this.loadFile(basePath, 'plan.md'),
      this.listTaskFiles(epicId),
    ]);

    const tasks = await Promise.all(
      taskFiles.map((file) => this.loadTask(epicId, file.name))
    );

    return {
      id: epicId,
      name: epicId,
      goal,
      requirements,
      plan,
      tasks: tasks.filter((t): t is Task => t !== null),
    };
  }

  /**
   * Update goal.md
   */
  async updateGoal(epicId: string, content: string): Promise<void> {
    const path = `epics/${epicId}/goal.md`;
    const sha = await this.getFileSha(path);
    await this.github.createOrUpdateFile(
      this.owner,
      this.repo,
      path,
      content,
      `Update goal for epic: ${epicId}`,
      sha
    );
  }

  /**
   * Update requirements.md
   */
  async updateRequirements(epicId: string, content: string): Promise<void> {
    const path = `epics/${epicId}/requirements.md`;
    const sha = await this.getFileSha(path);
    await this.github.createOrUpdateFile(
      this.owner,
      this.repo,
      path,
      content,
      `Update requirements for epic: ${epicId}`,
      sha
    );
  }

  /**
   * Update plan.md
   */
  async updatePlan(epicId: string, content: string): Promise<void> {
    const path = `epics/${epicId}/plan.md`;
    const sha = await this.getFileSha(path);
    await this.github.createOrUpdateFile(
      this.owner,
      this.repo,
      path,
      content,
      `Update plan for epic: ${epicId}`,
      sha
    );
  }

  /**
   * Create a new task
   */
  async createTask(epicId: string, order: number, title: string, content: string): Promise<void> {
    const slug = this.slugify(title);
    const taskId = `${String(order).padStart(3, '0')}-${slug}`;
    const path = `epics/${epicId}/tasks/${taskId}.md`;

    await this.github.createOrUpdateFile(
      this.owner,
      this.repo,
      path,
      content,
      `Create task ${taskId} for epic: ${epicId}`
    );
  }

  /**
   * Helper: List task files
   */
  private async listTaskFiles(epicId: string): Promise<Array<{ name: string; path: string }>> {
    try {
      const files = await this.github.listDirectory(this.owner, this.repo, `epics/${epicId}/tasks`);
      return files
        .filter((f) => f.type === 'file' && f.name.endsWith('.md') && f.name !== '.gitkeep')
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }

  /**
   * Helper: Load a file
   */
  private async loadFile(basePath: string, filename: string): Promise<string | undefined> {
    try {
      return await this.github.getFile(this.owner, this.repo, `${basePath}/${filename}`);
    } catch {
      return undefined;
    }
  }

  /**
   * Helper: Load a task
   */
  private async loadTask(epicId: string, filename: string): Promise<Task | null> {
    try {
      const content = await this.github.getFile(
        this.owner,
        this.repo,
        `epics/${epicId}/tasks/${filename}`
      );

      const match = filename.match(/^(\d+)-(.+)\.md$/);
      if (!match) return null;

      const [, orderStr, slug] = match;
      const order = parseInt(orderStr, 10);

      return {
        id: filename.replace('.md', ''),
        slug,
        title: this.titleFromSlug(slug),
        content,
        subtasks: [],
        order,
      };
    } catch {
      return null;
    }
  }

  /**
   * Helper: Get file SHA (for updates)
   */
  private async getFileSha(path: string): Promise<string | undefined> {
    try {
      const files = await this.github.listDirectory(this.owner, this.repo, path.split('/').slice(0, -1).join('/'));
      const file = files.find((f) => f.path === path);
      return file?.sha;
    } catch {
      return undefined;
    }
  }

  /**
   * Helper: Slugify string
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Helper: Convert slug to title
   */
  private titleFromSlug(slug: string): string {
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
