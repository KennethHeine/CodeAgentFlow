'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Epic } from '@/lib/types';
import { getEpicStatusColor } from '@/lib/state-machine';

export default function Dashboard() {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/epics')
      .then(res => res.json())
      .then(data => { setEpics(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Error loading epics: {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your intent-driven coding workflows</p>
        </div>
        <Link
          href="/epics/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          + Create New Epic
        </Link>
      </div>

      {epics.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No epics yet</h2>
          <p className="text-gray-500 mb-6">Create your first epic to get started with CodeAgentFlow.</p>
          <Link
            href="/epics/new"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Create Epic
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {epics.map(epic => (
            <Link
              key={epic.id}
              href={`/epics/${epic.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">{epic.title}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getEpicStatusColor(epic.status)}`}>
                      {epic.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">{epic.intent}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>📦 {epic.repo}</span>
                    <span>🌿 {epic.defaultBranch}</span>
                    <span>📅 {new Date(epic.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
