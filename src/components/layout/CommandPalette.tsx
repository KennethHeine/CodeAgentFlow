import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores/ui';
import { useEpicStore } from '@/stores/epic';
import {
  LayoutDashboard,
  Layers,
  Settings,
  Plus,
  Search,
  Command,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaletteItem {
  id: string;
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  action: () => void;
  section: string;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const epics = useEpicStore(s => s.epics);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: PaletteItem[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Go to Dashboard', shortcut: 'G D', action: () => navigate('/'), section: 'Navigation' },
    { id: 'epics', icon: Layers, label: 'Go to Epics', shortcut: 'G E', action: () => navigate('/epics'), section: 'Navigation' },
    { id: 'settings', icon: Settings, label: 'Go to Settings', shortcut: 'G S', action: () => navigate('/settings'), section: 'Navigation' },
    { id: 'new-epic', icon: Plus, label: 'Create New Epic', shortcut: 'N', action: () => navigate('/epics/new'), section: 'Actions' },
    ...epics.map(epic => ({
      id: `epic-${epic.id}`,
      icon: Layers,
      label: epic.name,
      action: () => navigate(`/epics/${epic.id}`),
      section: 'Epics',
    })),
  ];

  const filtered = query
    ? items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  const sections = [...new Set(filtered.map(i => i.section))];

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!commandPaletteOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          setCommandPaletteOpen(false);
        }
      } else if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, filtered, selectedIndex, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  let flatIndex = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="bg-surface-1 border border-border-default rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-muted">
          <Search size={16} className="text-gray-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-gray-100 outline-none placeholder:text-gray-500"
          />
          <kbd className="flex items-center gap-0.5">
            <Command size={10} />K
          </kbd>
        </div>

        <div className="max-h-[300px] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-8">No results found</p>
          )}

          {sections.map(section => {
            const sectionItems = filtered.filter(i => i.section === section);
            return (
              <div key={section}>
                <p className="text-xs font-medium text-gray-500 px-4 py-1.5 uppercase tracking-wider">
                  {section}
                </p>
                {sectionItems.map(item => {
                  flatIndex++;
                  const idx = flatIndex;
                  return (
                    <button
                      key={item.id}
                      className={cn(
                        'flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors text-left',
                        idx === selectedIndex
                          ? 'bg-brand-600/10 text-brand-300'
                          : 'text-gray-300 hover:bg-surface-2',
                      )}
                      onClick={() => {
                        item.action();
                        setCommandPaletteOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <item.icon size={16} className="shrink-0 text-gray-500" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.shortcut && <kbd>{item.shortcut}</kbd>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
