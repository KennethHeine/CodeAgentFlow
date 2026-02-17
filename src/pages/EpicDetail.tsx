import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEpicStore } from '@/stores/epic';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { TextArea } from '@/components/ui/TextArea';
import {
  epicStatusLabel,
  epicStatusColor,
  taskStatusLabel,
  taskStatusColor,
  splitRepoFullName,
} from '@/lib/utils';
import type { EpicStep } from '@/types';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  ListChecks,
  Target,
  ClipboardList,
  Map,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const steps: { key: EpicStep; label: string; icon: typeof Target }[] = [
  { key: 'goal', label: 'Goal', icon: Target },
  { key: 'requirements', label: 'Requirements', icon: ClipboardList },
  { key: 'plan', label: 'Plan', icon: Map },
  { key: 'tasks', label: 'Tasks', icon: ListChecks },
];

export function EpicDetail() {
  const { epicId } = useParams<{ epicId: string }>();
  const navigate = useNavigate();
  const { currentEpic, isLoading, loadEpicDetail, saveEpicStep, epicRepoFullName } = useEpicStore();

  const [activeStep, setActiveStep] = useState<EpicStep>('goal');
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (epicId) {
      loadEpicDetail(epicId);
    }
  }, [epicId, loadEpicDetail]);

  useEffect(() => {
    if (currentEpic) {
      if (!currentEpic.goal) setActiveStep('goal');
      else if (!currentEpic.requirements) setActiveStep('requirements');
      else if (!currentEpic.plan) setActiveStep('plan');
      else setActiveStep('tasks');
    }
  }, [currentEpic]);

  const repo = splitRepoFullName(epicRepoFullName);
  const repoUrl = repo ? `https://github.com/${repo.owner}/${repo.repo}` : '';

  const stepContent = (step: EpicStep): string | undefined => {
    if (!currentEpic) return undefined;
    switch (step) {
      case 'goal': return currentEpic.goal;
      case 'requirements': return currentEpic.requirements;
      case 'plan': return currentEpic.plan;
      case 'tasks': return undefined;
    }
  };

  const startEditing = (step: EpicStep) => {
    const content = stepContent(step);
    // Strip the markdown header (first two lines: "# ..." and blank)
    const stripped = content
      ? content.replace(/^#\s+.+\n\n?/, '').trim()
      : '';
    setEditContent(stripped);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!epicId) return;
    setSaving(true);
    try {
      await saveEpicStep(epicId, activeStep, editContent);
      toast.success(`${activeStep} saved`);
      setEditing(false);
      await loadEpicDetail(epicId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const isStepComplete = (step: EpicStep): boolean => {
    if (!currentEpic) return false;
    switch (step) {
      case 'goal': return !!currentEpic.goal;
      case 'requirements': return !!currentEpic.requirements;
      case 'plan': return !!currentEpic.plan;
      case 'tasks': return currentEpic.tasks.length > 0;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentEpic) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Epic not found.</p>
        <button onClick={() => navigate('/epics')} className="mt-3 text-sm text-brand-400 hover:text-brand-300">
          Back to Epics
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <button
        onClick={() => navigate('/epics')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Back to Epics
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 capitalize">{currentEpic.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={epicStatusColor(currentEpic.status)}>
              {epicStatusLabel(currentEpic.status)}
            </Badge>
            <span className="text-sm text-gray-500">{currentEpic.tasks.length} tasks</span>
            {repoUrl && (
              <a
                href={`${repoUrl}/tree/main/${currentEpic.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-brand-400 flex items-center gap-1 transition-colors"
              >
                <ExternalLink size={12} />
                View on GitHub
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-1 mb-8 bg-surface-1 border border-border-default rounded-xl p-1.5">
        {steps.map((step, idx) => (
          <button
            key={step.key}
            onClick={() => { setActiveStep(step.key); setEditing(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
              activeStep === step.key
                ? 'bg-surface-3 text-gray-100'
                : 'text-gray-500 hover:text-gray-300 hover:bg-surface-2'
            }`}
          >
            {isStepComplete(step.key) ? (
              <Check size={14} className="text-green-400" />
            ) : (
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs">
                {idx + 1}
              </span>
            )}
            <step.icon size={14} />
            {step.label}
          </button>
        ))}
      </div>

      {/* Step Content */}
      {activeStep !== 'tasks' && (
        <div className="bg-surface-1 border border-border-default rounded-xl">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border-muted">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-300">
                {activeStep}.md
              </span>
            </div>
            <div className="flex items-center gap-2">
              {repoUrl && (
                <a
                  href={`${repoUrl}/blob/main/${currentEpic.path}/${activeStep}.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 hover:text-brand-400 flex items-center gap-1"
                >
                  <ExternalLink size={11} /> GitHub
                </a>
              )}
              {!editing && (
                <Button size="sm" variant="secondary" onClick={() => startEditing(activeStep)}>
                  {stepContent(activeStep) ? 'Edit' : 'Write'}
                </Button>
              )}
            </div>
          </div>

          <div className="p-5">
            {editing ? (
              <div className="space-y-4">
                <TextArea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  placeholder={`Write the ${activeStep} for this epic in Markdown...`}
                  className="min-h-[300px]"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving || !editContent.trim()}>
                    {saving ? <><Spinner size="sm" /> Saving...</> : 'Save to GitHub'}
                  </Button>
                </div>
              </div>
            ) : stepContent(activeStep) ? (
              <div className="markdown-content">
                <Markdown remarkPlugins={[remarkGfm]}>{stepContent(activeStep)!}</Markdown>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-3">No {activeStep} written yet.</p>
                <Button size="sm" onClick={() => startEditing(activeStep)}>
                  Write {activeStep}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tasks Tab */}
      {activeStep === 'tasks' && (
        <div className="bg-surface-1 border border-border-default rounded-xl">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border-muted">
            <span className="text-sm font-medium text-gray-300">
              {currentEpic.tasks.length} Task{currentEpic.tasks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {currentEpic.tasks.length === 0 ? (
            <div className="text-center py-12 px-5">
              <p className="text-gray-500 mb-2">No tasks created yet.</p>
              <p className="text-xs text-gray-600 mb-4">
                Write a plan first, then tasks can be generated from it.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-muted">
              {currentEpic.tasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => navigate(`/epics/${epicId}/tasks/${task.id}`)}
                  className="flex items-center gap-4 w-full px-5 py-3.5 hover:bg-surface-2 transition-colors text-left"
                >
                  <span className="text-xs font-mono text-gray-600 w-8">
                    #{String(task.number).padStart(3, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {task.subtasks.length} subtask{task.subtasks.length !== 1 ? 's' : ''}
                      {task.githubIssueUrl && ' \u00B7 Issue linked'}
                      {task.githubPrUrl && ' \u00B7 PR linked'}
                    </p>
                  </div>
                  <Badge className={taskStatusColor(task.status)}>
                    {taskStatusLabel(task.status)}
                  </Badge>
                  <ChevronRight size={14} className="text-gray-600 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation between steps */}
      <div className="flex items-center justify-between mt-6">
        {activeStep !== 'goal' ? (
          <Button
            variant="ghost"
            onClick={() => {
              const idx = steps.findIndex(s => s.key === activeStep);
              if (idx > 0) { setActiveStep(steps[idx - 1].key); setEditing(false); }
            }}
          >
            <ArrowLeft size={14} />
            Previous
          </Button>
        ) : <div />}

        {activeStep !== 'tasks' && (
          <Button
            variant="ghost"
            onClick={() => {
              const idx = steps.findIndex(s => s.key === activeStep);
              if (idx < steps.length - 1) { setActiveStep(steps[idx + 1].key); setEditing(false); }
            }}
          >
            Next
            <ArrowRight size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
