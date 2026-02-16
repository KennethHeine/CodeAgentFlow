'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Epic, Task, AuditLog, TaskState } from '@/lib/types';
import { getStateColor, getEpicStatusColor, getValidTransitions } from '@/lib/state-machine';

interface EpicDetail extends Epic {
  tasks: Task[];
  auditLogs: AuditLog[];
}

export default function EpicDetailPage() {
  const params = useParams();
  const epicId = params.id as string;
  const [epic, setEpic] = useState<EpicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [blockedReason, setBlockedReason] = useState('');
  const [showBlockedModal, setShowBlockedModal] = useState<string | null>(null);

  const fetchEpic = useCallback(async () => {
    try {
      const res = await fetch(`/api/epics/${epicId}`);
      if (!res.ok) throw new Error('Epic not found');
      const data = await res.json();
      setEpic(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load epic');
    } finally {
      setLoading(false);
    }
  }, [epicId]);

  useEffect(() => {
    fetchEpic();
  }, [fetchEpic]);

  const handleTransition = async (taskId: string, targetState: TaskState, extra?: Record<string, string>) => {
    setActionLoading(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetState, ...extra }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Transition failed');
      }
      await fetchEpic();
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlockTask = async (taskId: string) => {
    if (!blockedReason.trim()) {
      alert('Please provide a reason for blocking');
      return;
    }
    await handleTransition(taskId, 'BLOCKED', { blockedReason });
    setShowBlockedModal(null);
    setBlockedReason('');
  };

  const handleGeneratePlan = async () => {
    setActionLoading('generate');
    try {
      const res = await fetch(`/api/epics/${epicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-plan' }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to generate plan');
      }
      await fetchEpic();
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      await fetch(`/api/epics/${epicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await fetchEpic();
    } catch {
      alert('Failed to update epic status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !epic) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error || 'Epic not found'}
      </div>
    );
  }

  const getActionButtons = (task: Task) => {
    const validTransitions = getValidTransitions(task.state);
    const buttons: { label: string; state: TaskState; color: string }[] = [];

    if (validTransitions.includes('RUNNING') && task.state === 'PLANNED') {
      buttons.push({ label: '▶ Start Task', state: 'RUNNING', color: 'bg-blue-600 hover:bg-blue-700 text-white' });
    }
    if (validTransitions.includes('PR_READY') && task.state === 'RUNNING') {
      buttons.push({ label: '✓ PR Ready', state: 'PR_READY', color: 'bg-indigo-600 hover:bg-indigo-700 text-white' });
    }
    if (validTransitions.includes('VALIDATING')) {
      buttons.push({ label: '🔍 Validate', state: 'VALIDATING', color: 'bg-yellow-600 hover:bg-yellow-700 text-white' });
    }
    if (validTransitions.includes('FIXING') && task.state === 'VALIDATING') {
      buttons.push({ label: '🔧 Fix', state: 'FIXING', color: 'bg-orange-600 hover:bg-orange-700 text-white' });
    }
    if (validTransitions.includes('APPROVAL_PENDING') && task.state === 'VALIDATING') {
      buttons.push({ label: '✅ Approve', state: 'APPROVAL_PENDING', color: 'bg-purple-600 hover:bg-purple-700 text-white' });
    }
    if (validTransitions.includes('MERGED') && task.state === 'APPROVAL_PENDING') {
      buttons.push({ label: '🔀 Merge', state: 'MERGED', color: 'bg-green-600 hover:bg-green-700 text-white' });
    }
    if (validTransitions.includes('DONE') && task.state === 'MERGED') {
      buttons.push({ label: '✔ Done', state: 'DONE', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' });
    }
    // For BLOCKED tasks, allow returning to a previous state
    if (task.state === 'BLOCKED') {
      buttons.push({ label: '↩ Unblock (Planned)', state: 'PLANNED', color: 'bg-gray-600 hover:bg-gray-700 text-white' });
    }

    return buttons;
  };

  return (
    <div>
      {/* Epic Header */}
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block">← Back to Dashboard</Link>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{epic.title}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getEpicStatusColor(epic.status)}`}>
                {epic.status}
              </span>
            </div>
            <p className="text-gray-600 mb-2">{epic.intent}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>📦 {epic.repo}</span>
              <span>🌿 {epic.defaultBranch}</span>
              <span>🛡 {epic.validationProfile}</span>
              <span>📅 Created {new Date(epic.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {epic.status === 'DRAFT' && (
              <button
                onClick={() => handleUpdateStatus('RUNNING')}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Start Epic
              </button>
            )}
            {epic.status === 'RUNNING' && (
              <button
                onClick={() => handleUpdateStatus('COMPLETED')}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Mark Completed
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Timeline */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Tasks ({epic.tasks.length})</h2>
          {epic.tasks.length === 0 && (
            <button
              onClick={handleGeneratePlan}
              disabled={actionLoading === 'generate'}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              {actionLoading === 'generate' ? 'Generating...' : '🧠 Generate Plan'}
            </button>
          )}
        </div>

        {epic.tasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No tasks yet. Click &quot;Generate Plan&quot; to create tasks from your intent.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {epic.tasks.map((task, index) => (
              <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-gray-400 text-sm font-mono">#{index + 1}</span>
                      <Link
                        href={`/epics/${epicId}/tasks/${task.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 transition"
                      >
                        {task.title}
                      </Link>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStateColor(task.state)}`}>
                        {task.state}
                      </span>
                      {task.attempts > 0 && (
                        <span className="text-xs text-gray-400">Attempt #{task.attempts}</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm ml-8 mb-2">{task.description}</p>
                    <div className="flex items-center gap-3 ml-8 text-xs text-gray-400">
                      {task.prUrl && (
                        <a href={task.prUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                          🔗 PR
                        </a>
                      )}
                      {task.branchName && <span>🌿 {task.branchName}</span>}
                      {task.blockedReason && (
                        <span className="text-red-500">🚫 {task.blockedReason}</span>
                      )}
                      <span>Updated {new Date(task.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {getActionButtons(task).map(btn => (
                      <button
                        key={btn.state}
                        onClick={() => handleTransition(task.id, btn.state)}
                        disabled={actionLoading === task.id}
                        className={`px-3 py-1 text-xs rounded-lg transition font-medium disabled:opacity-50 ${btn.color}`}
                      >
                        {actionLoading === task.id ? '...' : btn.label}
                      </button>
                    ))}
                    {task.state !== 'DONE' && task.state !== 'BLOCKED' && (
                      <button
                        onClick={() => setShowBlockedModal(task.id)}
                        className="px-3 py-1 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition font-medium"
                      >
                        🚫 Block
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blocked Modal */}
      {showBlockedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Block Task</h3>
            <p className="text-sm text-gray-500 mb-3">Please provide a reason for blocking this task:</p>
            <textarea
              rows={3}
              value={blockedReason}
              onChange={e => setBlockedReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              placeholder="What decision or action is needed?"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowBlockedModal(null); setBlockedReason(''); }}
                className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBlockTask(showBlockedModal)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Block Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Audit Log</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {epic.auditLogs.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No audit entries yet.</div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {epic.auditLogs.map(log => (
                <div key={log.id} className="px-4 py-2 flex items-center gap-3 text-sm">
                  <span className="text-gray-400 text-xs font-mono whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                  <span className="font-medium text-gray-700">{log.action}</span>
                  <span className="text-gray-500 flex-1">{log.details}</span>
                  <span className="text-gray-400 text-xs">{log.actor}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
