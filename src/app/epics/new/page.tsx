'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateEpicPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    intent: '',
    repo: '',
    defaultBranch: 'main',
    constraints: '',
    validationProfile: 'tests,lint',
    mergePolicy: 'manual',
    generateTasks: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/epics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create epic');
      }

      const epic = await res.json();
      router.push(`/epics/${epic.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Epic</h1>
      <p className="text-gray-500 mb-6">Define your high-level intent and let CodeAgentFlow generate a plan.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. Build user authentication system"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">High-level Intent *</label>
          <textarea
            required
            rows={4}
            value={form.intent}
            onChange={e => setForm({ ...form, intent: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe what you want to build in detail..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Repository (owner/repo) *</label>
            <input
              type="text"
              required
              value={form.repo}
              onChange={e => setForm({ ...form, repo: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. owner/repo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Branch</label>
            <input
              type="text"
              value={form.defaultBranch}
              onChange={e => setForm({ ...form, defaultBranch: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Constraints</label>
          <textarea
            rows={2}
            value={form.constraints}
            onChange={e => setForm({ ...form, constraints: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. Allowed paths: src/, max LOC per PR: 300, max files: 10"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Validation Profile</label>
            <select
              value={form.validationProfile}
              onChange={e => setForm({ ...form, validationProfile: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="tests,lint">Tests + Lint</option>
              <option value="tests,lint,codeql">Tests + Lint + CodeQL</option>
              <option value="tests">Tests only</option>
              <option value="lint">Lint only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Merge Policy</label>
            <select
              value={form.mergePolicy}
              onChange={e => setForm({ ...form, mergePolicy: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="manual">Manual Approval Required</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="generateTasks"
            checked={form.generateTasks}
            onChange={e => setForm({ ...form, generateTasks: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="generateTasks" className="text-sm text-gray-700">
            Auto-generate task plan on creation
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : form.generateTasks ? 'Create Epic & Generate Plan' : 'Create Epic'}
          </button>
        </div>
      </form>
    </div>
  );
}
