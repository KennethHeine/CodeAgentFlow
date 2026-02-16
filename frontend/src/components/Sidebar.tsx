import { FolderOpen, Plus, ChevronRight, Circle, CheckCircle, Clock, GitPullRequest } from 'lucide-react';
import type { Epic } from '../types';

interface SidebarProps {
  epics: Epic[];
  selectedEpic: string | null;
  onSelectEpic: (slug: string) => void;
  onCreateEpic: () => void;
}

export function Sidebar({ epics, selectedEpic, onSelectEpic, onCreateEpic }: SidebarProps) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <h2>
          <FolderOpen size={16} />
          Epics
        </h2>
        <button
          className="sidebar-add-btn"
          onClick={onCreateEpic}
          aria-label="Create new epic"
          title="Create new epic (N)"
          data-testid="create-epic-btn"
        >
          <Plus size={16} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {epics.length === 0 ? (
          <div className="sidebar-empty">
            <p>No epics yet.</p>
            <button className="sidebar-empty-btn" onClick={onCreateEpic}>
              Create your first epic
            </button>
          </div>
        ) : (
          <ul className="sidebar-list">
            {epics.map((epic) => (
              <li
                key={epic.slug}
                className={`sidebar-item ${selectedEpic === epic.slug ? 'active' : ''}`}
              >
                <button
                  className="sidebar-item-btn"
                  onClick={() => onSelectEpic(epic.slug)}
                  data-testid={`epic-item-${epic.slug}`}
                >
                  <ChevronRight size={14} className="sidebar-item-chevron" />
                  <span className="sidebar-item-name">{epic.name}</span>
                  {epic.tasks.length > 0 && (
                    <span className="sidebar-item-badge">
                      {epic.tasks.length}
                    </span>
                  )}
                </button>
                {selectedEpic === epic.slug && epic.tasks.length > 0 && (
                  <ul className="sidebar-tasks">
                    {epic.tasks.map((task) => (
                      <li key={task.id} className="sidebar-task">
                        <TaskStatusIcon status={task.status} />
                        <span>{task.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </nav>

      <div className="sidebar-footer">
        <kbd>N</kbd> New epic &middot; <kbd>?</kbd> Help
      </div>
    </aside>
  );
}

function TaskStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'done':
      return <CheckCircle size={12} className="status-done" />;
    case 'review':
      return <GitPullRequest size={12} className="status-review" />;
    case 'in-progress':
      return <Clock size={12} className="status-in-progress" />;
    default:
      return <Circle size={12} className="status-pending" />;
  }
}
