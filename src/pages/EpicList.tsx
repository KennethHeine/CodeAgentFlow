import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEpicStore } from '@/stores/epic';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { epicStatusLabel, epicStatusColor, formatRelativeTime } from '@/lib/utils';
import { Layers, Plus, ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';

export function EpicList() {
  const navigate = useNavigate();
  const { epics, isLoading, loadEpics, epicRepoFullName } = useEpicStore();
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (epicRepoFullName) {
      loadEpics();
    }
  }, [epicRepoFullName, loadEpics]);

  const filtered = filter
    ? epics.filter(e => e.name.toLowerCase().includes(filter.toLowerCase()))
    : epics;

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Epics</h1>
          <p className="text-gray-400 mt-1">
            {epics.length} epic{epics.length !== 1 ? 's' : ''} in {epicRepoFullName || 'no repo configured'}
          </p>
        </div>
        <button
          onClick={() => navigate('/epics/new')}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-500 transition-colors"
        >
          <Plus size={16} />
          New Epic
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter epics..."
          className="w-full bg-surface-1 border border-border-default rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      )}

      {!isLoading && filtered.length === 0 && !filter && (
        <EmptyState
          icon={Layers}
          title="No epics yet"
          description="Create your first epic to break down work into agent-friendly tasks."
          action={{ label: 'Create Epic', onClick: () => navigate('/epics/new') }}
        />
      )}

      {!isLoading && filtered.length === 0 && filter && (
        <EmptyState
          icon={Search}
          title="No matches"
          description={`No epics matching "${filter}"`}
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(epic => (
            <button
              key={epic.id}
              onClick={() => navigate(`/epics/${epic.id}`)}
              className="flex items-center gap-4 w-full bg-surface-1 border border-border-default rounded-xl px-5 py-4 hover:bg-surface-2 hover:border-border-default/80 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-3 flex items-center justify-center shrink-0 group-hover:bg-brand-600/10">
                <Layers size={18} className="text-gray-500 group-hover:text-brand-400 transition-colors" />
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
              <ArrowRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
