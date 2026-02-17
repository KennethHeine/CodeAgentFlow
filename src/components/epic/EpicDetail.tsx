import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, FileText, Target, ClipboardList, ListChecks, CheckCircle, Circle, Clock, GitPullRequest, RefreshCw, FolderOpen } from 'lucide-react';
import type { Epic } from '../../types';

interface EpicDetailProps {
  epic: Epic | null;
  loading: boolean;
  epicRepo: string | null;
  onRefresh: () => void;
}

type DetailTab = 'overview' | 'goal' | 'requirements' | 'plan' | 'tasks';

export function EpicDetail({ epic, loading, epicRepo, onRefresh }: EpicDetailProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const handleTabChange = useCallback((tab: DetailTab) => {
    setActiveTab(tab);
  }, []);

  useEffect(() => {
    setActiveTab('overview');
  }, [epic?.slug]);

  if (loading) {
    return (
      <div className="epic-detail-loading">
        <RefreshCw size={24} className="spin" />
        <p>Loading epic…</p>
      </div>
    );
  }

  if (!epic) {
    return (
      <div className="epic-detail-empty" data-testid="epic-detail-empty">
        <FolderOpen size={48} />
        <h2>Select an epic</h2>
        <p>Choose an epic from the sidebar or create a new one to get started.</p>
      </div>
    );
  }

  const githubLink = epicRepo ? `https://github.com/${epicRepo}/tree/main/epics/${epic.slug}` : null;

  return (
    <div className="epic-detail" data-testid="epic-detail">
      <div className="epic-detail-header">
        <div className="epic-detail-title-row">
          <h1>{epic.name}</h1>
          {githubLink && (
            <a href={githubLink} target="_blank" rel="noopener noreferrer" className="github-link">
              <ExternalLink size={14} /> View on GitHub
            </a>
          )}
          <button className="icon-btn" onClick={onRefresh} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="epic-detail-tabs">
          <TabButton tab="overview" active={activeTab} onClick={handleTabChange} icon={<FolderOpen size={14} />} />
          <TabButton tab="goal" active={activeTab} onClick={handleTabChange} icon={<Target size={14} />} />
          <TabButton tab="requirements" active={activeTab} onClick={handleTabChange} icon={<ClipboardList size={14} />} />
          <TabButton tab="plan" active={activeTab} onClick={handleTabChange} icon={<ListChecks size={14} />} />
          <TabButton tab="tasks" active={activeTab} onClick={handleTabChange} icon={<FileText size={14} />} />
        </div>
      </div>

      <div className="epic-detail-content">
        {activeTab === 'overview' && (
          <div className="epic-overview">
            <div className="overview-stats">
              <div className="stat-card">
                <span className="stat-value">{epic.tasks.length}</span>
                <span className="stat-label">Tasks</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{epic.tasks.filter((t) => t.status === 'done').length}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{epic.tasks.filter((t) => t.status === 'in-progress').length}</span>
                <span className="stat-label">In Progress</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{epic.tasks.filter((t) => t.status === 'review').length}</span>
                <span className="stat-label">In Review</span>
              </div>
            </div>
            <div className="overview-files">
              <h3>Epic Files</h3>
              <ul>
                {epic.goal && <li><FileText size={14} /> goal.md</li>}
                {epic.requirements && <li><FileText size={14} /> requirements.md</li>}
                {epic.plan && <li><FileText size={14} /> plan.md</li>}
                {epic.tasks.map((t) => (
                  <li key={t.id}><FileText size={14} /> tasks/{t.filename}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'goal' && (
          <div className="epic-markdown-view">
            <h2>Goal</h2>
            <pre className="markdown-content">{epic.goal || 'No goal defined yet.'}</pre>
          </div>
        )}

        {activeTab === 'requirements' && (
          <div className="epic-markdown-view">
            <h2>Requirements</h2>
            <pre className="markdown-content">{epic.requirements || 'No requirements defined yet.'}</pre>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="epic-markdown-view">
            <h2>Plan</h2>
            <pre className="markdown-content">{epic.plan || 'No plan defined yet.'}</pre>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="epic-tasks-view">
            <h2>Tasks ({epic.tasks.length})</h2>
            {epic.tasks.length === 0 ? (
              <p className="empty-text">No tasks defined yet.</p>
            ) : (
              <div className="task-list">
                {epic.tasks.map((task) => (
                  <div key={task.id} className="task-card" data-testid={`task-${task.id}`}>
                    <div className="task-card-header">
                      <TaskStatusIcon status={task.status} />
                      <span className="task-card-title">{task.title}</span>
                      {task.issueNumber && epicRepo && (
                        <a
                          href={`https://github.com/${epicRepo}/issues/${task.issueNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="task-link"
                        >
                          #{task.issueNumber}
                        </a>
                      )}
                      {task.prNumber && epicRepo && (
                        <a
                          href={`https://github.com/${epicRepo}/pull/${task.prNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="task-link pr-link"
                        >
                          PR #{task.prNumber}
                        </a>
                      )}
                    </div>
                    {task.subtasks.length > 0 && (
                      <ul className="task-subtasks">
                        {task.subtasks.map((sub, i) => (
                          <li key={i} className={`subtask ${sub.completed ? 'completed' : ''}`}>
                            <span className="subtask-type">{sub.type}</span>
                            <span>{sub.title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  tab,
  active,
  onClick,
  icon,
}: {
  tab: DetailTab;
  active: DetailTab;
  onClick: (tab: DetailTab) => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      className={`tab-btn ${active === tab ? 'active' : ''}`}
      onClick={() => onClick(tab)}
      data-testid={`tab-${tab}`}
    >
      {icon}
      <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
    </button>
  );
}

function TaskStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'done':
      return <CheckCircle size={16} className="status-done" />;
    case 'review':
      return <GitPullRequest size={16} className="status-review" />;
    case 'in-progress':
      return <Clock size={16} className="status-in-progress" />;
    default:
      return <Circle size={16} className="status-pending" />;
  }
}
