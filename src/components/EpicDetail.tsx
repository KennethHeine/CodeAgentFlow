import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Epic } from '../services/epic';

export const EpicDetail: React.FC = () => {
  const { epicId } = useParams<{ epicId: string }>();
  const { epicService, epicRepo } = useApp();
  const navigate = useNavigate();
  const [epic, setEpic] = useState<Epic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'goal' | 'requirements' | 'plan' | 'tasks'>('goal');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (epicId && epicService) {
      loadEpic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epicId, epicService]);

  const loadEpic = async () => {
    if (!epicId || !epicService) return;

    setIsLoading(true);
    try {
      const data = await epicService.getEpic(epicId);
      setEpic(data);
    } catch (error) {
      console.error('Failed to load epic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    if (!epic) return;

    let content = '';
    switch (activeTab) {
      case 'goal':
        content = epic.goal || '';
        break;
      case 'requirements':
        content = epic.requirements || '';
        break;
      case 'plan':
        content = epic.plan || '';
        break;
    }

    setEditContent(content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!epicId || !epicService) return;

    try {
      switch (activeTab) {
        case 'goal':
          await epicService.updateGoal(epicId, editContent);
          break;
        case 'requirements':
          await epicService.updateRequirements(epicId, editContent);
          break;
        case 'plan':
          await epicService.updatePlan(epicId, editContent);
          break;
      }

      await loadEpic();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">Loading epic...</p>
      </div>
    );
  }

  if (!epic) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Epic not found</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Epics
          </button>
        </div>
      </div>
    );
  }

  const getTabContent = () => {
    switch (activeTab) {
      case 'goal':
        return epic.goal || '# Goal\n\n<!-- Describe what success looks like -->';
      case 'requirements':
        return epic.requirements || '# Requirements\n\n<!-- Define constraints, non-goals, acceptance criteria -->';
      case 'plan':
        return epic.plan || '# Plan\n\n<!-- Break down the epic into tasks -->';
      case 'tasks':
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-github-accent hover:underline mb-4 inline-block"
        >
          ← Back to Epics
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{epic.name}</h1>
            <p className="text-gray-400 mt-1">
              <a
                href={`https://github.com/${epicRepo}/tree/main/epics/${epicId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-github-accent hover:underline"
              >
                View in GitHub →
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-github-border mb-6">
        <nav className="flex gap-6">
          {(['goal', 'requirements', 'plan', 'tasks'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setIsEditing(false);
              }}
              className={`pb-3 px-1 border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-github-accent text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab !== 'tasks' ? (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold capitalize">{activeTab}</h2>
            {!isEditing ? (
              <button onClick={handleEdit} className="btn-secondary">
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSave} className="btn-primary">
                  Save
                </button>
                <button onClick={() => setIsEditing(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="input-field w-full font-mono text-sm"
              rows={20}
              autoFocus
            />
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-sm bg-github-darker p-4 rounded border border-github-border overflow-auto">
              {getTabContent()}
            </pre>
          )}
        </div>
      ) : (
        <div>
          {epic.tasks.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-400">No tasks yet. Define tasks in the Plan tab.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {epic.tasks.map((task) => (
                <div key={task.id} className="card">
                  <h3 className="text-lg font-semibold">{task.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    <a
                      href={`https://github.com/${epicRepo}/blob/main/epics/${epicId}/tasks/${task.id}.md`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-github-accent hover:underline"
                    >
                      View task file →
                    </a>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
