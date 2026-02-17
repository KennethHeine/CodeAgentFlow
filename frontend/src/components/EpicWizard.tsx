import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, FileText, ListChecks, Target, ClipboardList } from 'lucide-react';
import { slugify } from '../utils';
import type { EpicCreationState, EpicStep, TaskDraft, SubtaskDraft } from '../types';

interface EpicWizardProps {
  onComplete: (state: EpicCreationState) => void;
  onCancel: () => void;
  saving: boolean;
}

const STEPS: EpicStep[] = ['name', 'goal', 'requirements', 'plan', 'tasks'];

const STEP_META: Record<EpicStep, { label: string; icon: React.ReactNode; description: string }> = {
  name: { label: 'Name', icon: <FileText size={18} />, description: 'Give your epic a clear, descriptive name' },
  goal: { label: 'Goal', icon: <Target size={18} />, description: 'Describe what success looks like' },
  requirements: { label: 'Requirements', icon: <ClipboardList size={18} />, description: 'Define constraints, non-goals, and acceptance criteria' },
  plan: { label: 'Plan', icon: <ListChecks size={18} />, description: 'Break the epic into small, agent-sized tasks' },
  tasks: { label: 'Tasks', icon: <CheckCircle size={18} />, description: 'Define subtasks with research and work steps' },
};

export function EpicWizard({ onComplete, onCancel, saving }: EpicWizardProps) {
  const [state, setState] = useState<EpicCreationState>({
    step: 'name',
    name: '',
    goal: '',
    requirements: '',
    plan: '',
    tasks: [],
  });

  const currentIndex = STEPS.indexOf(state.step);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === STEPS.length - 1;

  const canProceed = () => {
    switch (state.step) {
      case 'name': return state.name.trim().length > 0;
      case 'goal': return state.goal.trim().length > 0;
      case 'requirements': return state.requirements.trim().length > 0;
      case 'plan': return state.plan.trim().length > 0;
      case 'tasks': return true;
      default: return false;
    }
  };

  const goNext = () => {
    if (!isLast && canProceed()) {
      setState((s) => ({ ...s, step: STEPS[currentIndex + 1] }));
    }
  };

  const goBack = () => {
    if (!isFirst) {
      setState((s) => ({ ...s, step: STEPS[currentIndex - 1] }));
    }
  };

  const handleSubmit = () => {
    if (canProceed()) {
      onComplete(state);
    }
  };

  const addTask = () => {
    setState((s) => ({
      ...s,
      tasks: [...s.tasks, { title: '', slug: '', subtasks: [] }],
    }));
  };

  const updateTask = (index: number, updates: Partial<TaskDraft>) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t, i) =>
        i === index ? { ...t, ...updates, slug: updates.title ? slugify(updates.title) : t.slug } : t
      ),
    }));
  };

  const removeTask = (index: number) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.filter((_, i) => i !== index),
    }));
  };

  const addSubtask = (taskIndex: number) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t, i) =>
        i === taskIndex
          ? { ...t, subtasks: [...t.subtasks, { title: '', type: 'work' as const, description: '' }] }
          : t
      ),
    }));
  };

  const updateSubtask = (taskIndex: number, subIndex: number, updates: Partial<SubtaskDraft>) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t, i) =>
        i === taskIndex
          ? {
              ...t,
              subtasks: t.subtasks.map((st, si) =>
                si === subIndex ? { ...st, ...updates } : st
              ),
            }
          : t
      ),
    }));
  };

  const removeSubtask = (taskIndex: number, subIndex: number) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t, i) =>
        i === taskIndex
          ? { ...t, subtasks: t.subtasks.filter((_, si) => si !== subIndex) }
          : t
      ),
    }));
  };

  const meta = STEP_META[state.step];

  return (
    <div className="wizard-overlay" data-testid="epic-wizard">
      <div className="wizard">
        {/* Progress bar */}
        <div className="wizard-progress">
          {STEPS.map((step, i) => (
            <div
              key={step}
              className={`wizard-step-indicator ${i <= currentIndex ? 'active' : ''} ${i < currentIndex ? 'completed' : ''}`}
            >
              <div className="wizard-step-dot">
                {i < currentIndex ? <CheckCircle size={14} /> : <span>{i + 1}</span>}
              </div>
              <span className="wizard-step-label">{STEP_META[step].label}</span>
            </div>
          ))}
        </div>

        {/* Step header */}
        <div className="wizard-header">
          {meta.icon}
          <div>
            <h2>{meta.label}</h2>
            <p>{meta.description}</p>
          </div>
        </div>

        {/* Step content */}
        <div className="wizard-content">
          {state.step === 'name' && (
            <div className="wizard-field">
              <label htmlFor="epic-name">Epic Name</label>
              <input
                id="epic-name"
                type="text"
                value={state.name}
                onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
                placeholder="e.g., Migrate Authentication to OAuth2"
                autoFocus
                data-testid="epic-name-input"
              />
              {state.name && (
                <p className="wizard-hint">
                  Slug: <code>{slugify(state.name)}</code>
                </p>
              )}
            </div>
          )}

          {state.step === 'goal' && (
            <div className="wizard-field">
              <label htmlFor="epic-goal">Goal (Markdown supported)</label>
              <textarea
                id="epic-goal"
                value={state.goal}
                onChange={(e) => setState((s) => ({ ...s, goal: e.target.value }))}
                placeholder="Describe what success looks like for this epic..."
                rows={10}
                autoFocus
                data-testid="epic-goal-input"
              />
            </div>
          )}

          {state.step === 'requirements' && (
            <div className="wizard-field">
              <label htmlFor="epic-requirements">Requirements (Markdown supported)</label>
              <textarea
                id="epic-requirements"
                value={state.requirements}
                onChange={(e) => setState((s) => ({ ...s, requirements: e.target.value }))}
                placeholder="Define constraints, non-goals, acceptance criteria..."
                rows={10}
                autoFocus
                data-testid="epic-requirements-input"
              />
            </div>
          )}

          {state.step === 'plan' && (
            <div className="wizard-field">
              <label htmlFor="epic-plan">Plan (Markdown supported)</label>
              <textarea
                id="epic-plan"
                value={state.plan}
                onChange={(e) => setState((s) => ({ ...s, plan: e.target.value }))}
                placeholder="High-level plan describing how to break the epic into tasks..."
                rows={10}
                autoFocus
                data-testid="epic-plan-input"
              />
            </div>
          )}

          {state.step === 'tasks' && (
            <div className="wizard-tasks">
              {state.tasks.map((task, ti) => (
                <div key={ti} className="wizard-task-card" data-testid={`task-card-${ti}`}>
                  <div className="wizard-task-header">
                    <span className="wizard-task-number">{ti + 1}</span>
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => updateTask(ti, { title: e.target.value })}
                      placeholder="Task title"
                      className="wizard-task-title-input"
                    />
                    <button
                      className="wizard-remove-btn"
                      onClick={() => removeTask(ti)}
                      title="Remove task"
                    >
                      ×
                    </button>
                  </div>

                  {task.subtasks.map((sub, si) => (
                    <div key={si} className="wizard-subtask">
                      <select
                        value={sub.type}
                        onChange={(e) =>
                          updateSubtask(ti, si, { type: e.target.value as 'research' | 'work' })
                        }
                        className="wizard-subtask-type"
                      >
                        <option value="research">Research</option>
                        <option value="work">Work</option>
                      </select>
                      <input
                        type="text"
                        value={sub.title}
                        onChange={(e) => updateSubtask(ti, si, { title: e.target.value })}
                        placeholder="Subtask title"
                        className="wizard-subtask-title"
                      />
                      <button
                        className="wizard-remove-btn"
                        onClick={() => removeSubtask(ti, si)}
                        title="Remove subtask"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <button className="wizard-add-subtask-btn" onClick={() => addSubtask(ti)}>
                    + Add subtask
                  </button>
                </div>
              ))}

              <button className="wizard-add-task-btn" onClick={addTask} data-testid="add-task-btn">
                + Add task
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="wizard-footer">
          <button className="wizard-cancel-btn" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <div className="wizard-nav-buttons">
            {!isFirst && (
              <button className="wizard-back-btn" onClick={goBack} disabled={saving}>
                <ArrowLeft size={14} /> Back
              </button>
            )}
            {isLast ? (
              <button
                className="wizard-submit-btn"
                onClick={handleSubmit}
                disabled={!canProceed() || saving}
                data-testid="wizard-submit"
              >
                {saving ? 'Creating…' : 'Create Epic'}
              </button>
            ) : (
              <button
                className="wizard-next-btn"
                onClick={goNext}
                disabled={!canProceed()}
                data-testid="wizard-next"
              >
                Next <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
