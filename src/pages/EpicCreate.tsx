import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEpicStore } from '@/stores/epic';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { ArrowLeft, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export function EpicCreate() {
  const navigate = useNavigate();
  const { createEpic, epicRepoFullName } = useEpicStore();
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      const epic = await createEpic(name.trim());
      toast.success(`Epic "${name}" created`);
      navigate(`/epics/${epic.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create epic';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  if (!epicRepoFullName) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Please configure your Epic repository in Settings first.</p>
        <button
          onClick={() => navigate('/settings')}
          className="mt-3 text-sm text-brand-400 hover:text-brand-300"
        >
          Go to Settings
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <button
        onClick={() => navigate('/epics')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Back to Epics
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-600/10 flex items-center justify-center">
          <Zap size={20} className="text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Create New Epic</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Start a new epic in <code className="text-xs bg-surface-3 px-1.5 py-0.5 rounded">{epicRepoFullName}</code>
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-surface-1 border border-border-default rounded-xl p-6 space-y-5">
        <Input
          id="epic-name"
          label="Epic Name"
          placeholder="e.g., User Authentication System"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />

        <p className="text-xs text-gray-500">
          A folder will be created at <code className="bg-surface-3 px-1 py-0.5 rounded">epics/{name ? name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '<slug>'}/</code> with
          a scaffold for goal, requirements, plan, and tasks.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={() => navigate('/epics')}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || isCreating}>
            {isCreating ? (
              <>
                <Spinner size="sm" />
                Creating...
              </>
            ) : (
              'Create Epic'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
