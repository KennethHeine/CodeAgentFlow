import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEpicStore } from '@/stores/epic';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  taskStatusLabel,
  taskStatusColor,
  splitRepoFullName,
} from '@/lib/utils';
import {
  ArrowLeft,
  ExternalLink,
  Search,
  Wrench,
  CheckCircle2,
  Circle,
  GitPullRequest,
  GitBranch,
  FileText,
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function TaskDetail() {
  const { epicId, taskId } = useParams<{ epicId: string; taskId: string }>();
  const navigate = useNavigate();
  const { currentEpic, isLoading, loadEpicDetail, epicRepoFullName } = useEpicStore();

  useEffect(() => {
    if (epicId && !currentEpic) {
      loadEpicDetail(epicId);
    }
    // loadEpicDetail is a stable Zustand store function, omitted from deps intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epicId, currentEpic]);

  const task = currentEpic?.tasks.find(t => t.id === taskId);
  const repo = splitRepoFullName(epicRepoFullName);
  const repoUrl = repo ? `https://github.com/${repo.owner}/${repo.repo}` : '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!task || !currentEpic) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Task not found.</p>
        <button onClick={() => navigate(`/epics/${epicId}`)} className="mt-3 text-sm text-brand-400">
          Back to Epic
        </button>
      </div>
    );
  }

  const researchSubtasks = task.subtasks.filter(s => s.type === 'research');
  const workSubtasks = task.subtasks.filter(s => s.type === 'work');

  return (
    <div className="p-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button onClick={() => navigate('/epics')} className="hover:text-gray-300 transition-colors">
          Epics
        </button>
        <span>/</span>
        <button onClick={() => navigate(`/epics/${epicId}`)} className="hover:text-gray-300 transition-colors capitalize">
          {currentEpic.name}
        </button>
        <span>/</span>
        <span className="text-gray-300">Task #{String(task.number).padStart(3, '0')}</span>
      </div>

      <button
        onClick={() => navigate(`/epics/${epicId}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Back to Epic
      </button>

      {/* Task Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{task.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={taskStatusColor(task.status)}>
              {taskStatusLabel(task.status)}
            </Badge>
            <span className="text-sm text-gray-500 font-mono">
              #{String(task.number).padStart(3, '0')}-{task.slug}
            </span>
          </div>
        </div>
      </div>

      {/* GitHub Links */}
      <div className="flex items-center gap-4 mb-6">
        {task.githubIssueUrl && (
          <a
            href={task.githubIssueUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View issue #${task.githubIssueNumber} on GitHub (opens in new tab)`}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-400 transition-colors bg-surface-1 border border-border-default rounded-lg px-3 py-1.5"
          >
            <GitBranch size={14} aria-hidden="true" />
            Issue #{task.githubIssueNumber}
            <ExternalLink size={11} aria-hidden="true" />
          </a>
        )}
        {task.githubPrUrl && (
          <a
            href={task.githubPrUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View pull request #${task.githubPrNumber} on GitHub (opens in new tab)`}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-400 transition-colors bg-surface-1 border border-border-default rounded-lg px-3 py-1.5"
          >
            <GitPullRequest size={14} aria-hidden="true" />
            PR #{task.githubPrNumber}
            <ExternalLink size={11} aria-hidden="true" />
          </a>
        )}
        {repoUrl && (
          <a
            href={`${repoUrl}/blob/main/${currentEpic.path}/tasks/${String(task.number).padStart(3, '0')}-${task.slug}.md`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View task spec on GitHub (opens in new tab)"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-400 transition-colors bg-surface-1 border border-border-default rounded-lg px-3 py-1.5"
          >
            <FileText size={14} aria-hidden="true" />
            View spec
            <ExternalLink size={11} aria-hidden="true" />
          </a>
        )}
      </div>

      {/* Task Content */}
      <div className="bg-surface-1 border border-border-default rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Description</h2>
        <div className="markdown-content">
          <Markdown remarkPlugins={[remarkGfm]}>{task.content}</Markdown>
        </div>
      </div>

      {/* Subtasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Research Steps */}
        <div className="bg-surface-1 border border-border-default rounded-xl">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border-muted">
            <Search size={14} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-300">
              Research ({researchSubtasks.length})
            </h3>
          </div>
          <div className="p-3 space-y-1">
            {researchSubtasks.length === 0 && (
              <p className="text-sm text-gray-600 py-4 text-center">No research steps</p>
            )}
            {researchSubtasks.map(sub => (
              <div
                key={sub.id}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors"
              >
                {sub.completed ? (
                  <CheckCircle2 size={16} className="text-green-400 mt-0.5 shrink-0" />
                ) : (
                  <Circle size={16} className="text-gray-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-sm text-gray-200">{sub.title}</p>
                  {sub.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{sub.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Work Steps */}
        <div className="bg-surface-1 border border-border-default rounded-xl">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border-muted">
            <Wrench size={14} className="text-orange-400" />
            <h3 className="text-sm font-semibold text-gray-300">
              Work ({workSubtasks.length})
            </h3>
          </div>
          <div className="p-3 space-y-1">
            {workSubtasks.length === 0 && (
              <p className="text-sm text-gray-600 py-4 text-center">No work steps</p>
            )}
            {workSubtasks.map(sub => (
              <div
                key={sub.id}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors"
              >
                {sub.completed ? (
                  <CheckCircle2 size={16} className="text-green-400 mt-0.5 shrink-0" />
                ) : (
                  <Circle size={16} className="text-gray-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-sm text-gray-200">{sub.title}</p>
                  {sub.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{sub.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orchestration Status */}
      <div className="mt-6 bg-surface-1 border border-border-default rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Orchestration Pipeline</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { label: 'Pending', status: 'pending' },
            { label: 'Issue Created', status: 'issue_created' },
            { label: 'Agent Running', status: 'agent_running' },
            { label: 'PR Open', status: 'pr_open' },
            { label: 'In Review', status: 'pr_review' },
            { label: 'Merged', status: 'pr_merged' },
          ].map((stage, idx) => (
            <div key={stage.status} className="flex items-center gap-2">
              {idx > 0 && <div className="w-6 h-px bg-border-default" />}
              <div
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  task.status === stage.status
                    ? taskStatusColor(stage.status) + ' ring-1 ring-current/20'
                    : 'text-gray-600 bg-surface-2'
                }`}
              >
                {stage.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
