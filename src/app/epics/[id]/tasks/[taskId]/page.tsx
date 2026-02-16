'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { TaskState } from '@/lib/types';
import { getStateColor, getValidTransitions, canTransition } from '@/lib/state-machine';
import { useTaskDetail, updateTaskState, createValidationRun } from '@/lib/use-store';

export default function TaskDetailPage() {
  const params = useParams();
  const epicId = params.id as string;
  const taskId = params.taskId as string;

  const { task, validationRuns, auditLogs } = useTaskDetail(taskId);
  const [actionLoading, setActionLoading] = useState(false);

  const handleTransition = (targetState: TaskState, extra?: Record<string, string>) => {
    if (!task) return;
    setActionLoading(true);

    if (!canTransition(task.state, targetState)) {
      alert(`Invalid transition: ${task.state} → ${targetState}`);
      setActionLoading(false);
      return;
    }

    if (targetState === 'BLOCKED' && !extra?.blockedReason) {
      alert('blockedReason is required when transitioning to BLOCKED');
      setActionLoading(false);
      return;
    }

    updateTaskState(taskId, targetState, extra);
    setActionLoading(false);
  };

  const handleCreateValidation = () => {
    setActionLoading(true);
    createValidationRun(taskId);
    setActionLoading(false);
  };

  if (!task) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Task not found
      </div>
    );
  }

  const validTransitions = getValidTransitions(task.state);

  const STATE_FLOW: TaskState[] = ['PLANNED', 'RUNNING', 'PR_READY', 'VALIDATING', 'FIXING', 'APPROVAL_PENDING', 'MERGED', 'DONE'];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-blue-600">Dashboard</Link>
        <span>/</span>
        <Link href={`/epics/${epicId}`} className="hover:text-blue-600">Epic</Link>
        <span>/</span>
        <span className="text-gray-900">Task #{task.order}</span>
      </div>

      {/* Task Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStateColor(task.state)}`}>
                {task.state}
              </span>
            </div>
            <p className="text-gray-600">{task.description}</p>
          </div>
          <div className="text-sm text-gray-400 text-right">
            <div>Attempts: {task.attempts}</div>
            <div>Updated: {new Date(task.updatedAt).toLocaleString()}</div>
          </div>
        </div>

        {/* State Progress Bar */}
        <div className="flex items-center gap-1 mb-4">
          {STATE_FLOW.map((s, i) => {
            const currentIdx = STATE_FLOW.indexOf(task.state);
            const isActive = s === task.state;
            const isPast = i < currentIdx && task.state !== 'BLOCKED';
            return (
              <div key={s} className="flex-1">
                <div className={`h-2 rounded-full ${isActive ? 'bg-blue-500' : isPast ? 'bg-green-400' : 'bg-gray-200'}`} />
                <div className={`text-[10px] mt-1 text-center ${isActive ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                  {s.replace('_', ' ')}
                </div>
              </div>
            );
          })}
        </div>

        {task.state === 'BLOCKED' && task.blockedReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="text-sm font-medium text-red-700 mb-1">🚫 Blocked</div>
            <div className="text-sm text-red-600">{task.blockedReason}</div>
          </div>
        )}

        {/* Links */}
        <div className="flex items-center gap-4 text-sm">
          {task.prUrl && (
            <a href={task.prUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
              🔗 Pull Request
            </a>
          )}
          {task.branchName && <span className="text-gray-500">🌿 Branch: {task.branchName}</span>}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Actions</h2>
        <div className="flex flex-wrap gap-2">
          {validTransitions.map(t => {
            const labels: Record<string, string> = {
              RUNNING: '▶ Start Agent Run',
              PR_READY: '✓ Mark PR Ready',
              VALIDATING: '🔍 Run Validation',
              FIXING: '🔧 Fix Validation',
              APPROVAL_PENDING: '✅ Approve Merge',
              MERGED: '🔀 Merge PR',
              DONE: '✔ Mark Done',
              PLANNED: '↩ Return to Planned',
              BLOCKED: '🚫 Block',
            };
            return (
              <button
                key={t}
                onClick={() => {
                  if (t === 'BLOCKED') {
                    const reason = prompt('Please provide a reason for blocking:');
                    if (reason) handleTransition(t, { blockedReason: reason });
                  } else {
                    handleTransition(t);
                  }
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition font-medium disabled:opacity-50"
              >
                {labels[t] || t}
              </button>
            );
          })}
          <button
            onClick={handleCreateValidation}
            disabled={actionLoading}
            className="px-4 py-2 text-sm rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-800 transition font-medium disabled:opacity-50"
          >
            🧪 New Validation Run
          </button>
        </div>
      </div>

      {/* Acceptance Criteria */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Acceptance Criteria</h2>
        {task.acceptanceCriteria.length === 0 ? (
          <p className="text-gray-500 text-sm">No criteria defined.</p>
        ) : (
          <ul className="space-y-1">
            {task.acceptanceCriteria.map((criterion, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-gray-400 mt-0.5">•</span>
                {criterion}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Validation Runs */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Validation Runs ({validationRuns.length})
        </h2>
        {validationRuns.length === 0 ? (
          <p className="text-gray-500 text-sm">No validation runs yet.</p>
        ) : (
          <div className="space-y-2">
            {validationRuns.map(run => (
              <div key={run.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    run.status === 'PASSED' ? 'bg-green-100 text-green-700' :
                    run.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    run.status === 'RUNNING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {run.status}
                  </span>
                  <span className="text-sm text-gray-600">
                    {new Date(run.createdAt).toLocaleString()}
                  </span>
                </div>
                {run.logsUrl && (
                  <a href={run.logsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">
                    View Logs
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit History */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">History</h2>
        {auditLogs.length === 0 ? (
          <p className="text-gray-500 text-sm">No history yet.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {auditLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 text-sm">
                <span className="text-gray-400 text-xs font-mono whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
                <span className="font-medium text-gray-700">{log.action}</span>
                <span className="text-gray-500">{log.details}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
