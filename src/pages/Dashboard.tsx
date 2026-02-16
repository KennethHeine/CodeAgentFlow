import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEpicStore } from '@/stores/epic';
import { useAuthStore } from '@/stores/auth';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { epicStatusLabel, epicStatusColor, formatRelativeTime } from '@/lib/utils';
import {
  Layers,
  Plus,
  ArrowRight,
  GitPullRequest,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
} from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const { epics, isLoading, loadEpics, epicRepoFullName } = useEpicStore();
  const { login } = useAuthStore();

  useEffect(() => {
    if (epicRepoFullName) {
      loadEpics();
    }
  }, [epicRepoFullName, loadEpics]);

  if (!epicRepoFullName) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-100">Welcome, {login}</h1>
          <p className="text-gray-400 mt-1">Let's get started with CodeAgentFlow</p>
        </div>
        <div className="bg-surface-1 border border-border-default rounded-xl p-6 max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-brand-600/10 flex items-center justify-center">
              <Zap size={20} className="text-brand-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-200">Configure Epic Repository</h2>
              <p className="text-sm text-gray-500">Set up where your epic specs will be stored</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Go to Settings to configure your Epic repository. This is a private repo where
            CodeAgentFlow stores markdown specs for goals, requirements, plans, and tasks.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
          >
            Go to Settings <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  const stats = {
    total: epics.length,
    inProgress: epics.filter(e => e.status === 'in_progress').length,
    ready: epics.filter(e => e.status === 'ready').length,
    completed: epics.filter(e => e.status === 'completed').length,
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-gray-400 mt-1">Overview of your epic orchestration</p>
        </div>
        <button
          onClick={() => navigate('/epics/new')}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-500 transition-colors"
        >
          <Plus size={16} />
          New Epic
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Epics', value: stats.total, icon: Layers, color: 'text-gray-400' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-yellow-400' },
          { label: 'Ready', value: stats.ready, icon: GitPullRequest, color: 'text-cyan-400' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-green-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-surface-1 border border-border-default rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <stat.icon size={16} className={stat.color} />
            </div>
            <p className="text-2xl font-bold text-gray-100">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Epics */}
      <div className="bg-surface-1 border border-border-default rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-muted">
          <h2 className="font-semibold text-gray-200">Recent Epics</h2>
          <button
            onClick={() => navigate('/epics')}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        )}

        {!isLoading && epics.length === 0 && (
          <EmptyState
            icon={Layers}
            title="No epics yet"
            description="Create your first epic to start orchestrating tasks with GitHub Copilot Coding Agent."
            action={{ label: 'Create Epic', onClick: () => navigate('/epics/new') }}
          />
        )}

        {!isLoading && epics.length > 0 && (
          <div className="divide-y divide-border-muted">
            {epics.slice(0, 5).map(epic => (
              <button
                key={epic.id}
                onClick={() => navigate(`/epics/${epic.id}`)}
                className="flex items-center gap-4 w-full px-5 py-3.5 hover:bg-surface-2 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-surface-3 flex items-center justify-center shrink-0">
                  <Layers size={16} className="text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate capitalize">
                    {epic.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {epic.tasks.length} tasks &middot; Updated {formatRelativeTime(epic.updatedAt)}
                  </p>
                </div>
                <Badge className={epicStatusColor(epic.status)}>
                  {epicStatusLabel(epic.status)}
                </Badge>
                {epic.status === 'in_progress' && epic.tasks.some(t => t.status === 'failed') && (
                  <AlertTriangle size={14} className="text-red-400 shrink-0" />
                )}
                <ArrowRight size={14} className="text-gray-600 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-6 flex items-center gap-4 text-xs text-gray-600">
        <span>
          <kbd>Ctrl+K</kbd> Command palette
        </span>
        <span>
          <kbd>N</kbd> New epic
        </span>
        <span>
          <kbd>Ctrl+B</kbd> Toggle sidebar
        </span>
      </div>
    </div>
  );
}
