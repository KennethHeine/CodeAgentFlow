import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import {
  LayoutDashboard,
  Layers,
  Settings,
  Plus,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Zap,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', shortcut: 'G D' },
  { to: '/epics', icon: Layers, label: 'Epics', shortcut: 'G E' },
  { to: '/settings', icon: Settings, label: 'Settings', shortcut: 'G S' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { login, logout } = useAuthStore();

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-surface-1 border-r border-border-muted transition-all duration-200',
        sidebarOpen ? 'w-60' : 'w-16',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border-muted">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="shrink-0 w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          {sidebarOpen && (
            <span className="text-sm font-semibold text-gray-200 truncate">
              CodeAgentFlow
            </span>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
        </button>
      </div>

      {/* New Epic button */}
      <div className="px-3 py-3">
        <button
          onClick={() => navigate('/epics/new')}
          className={cn(
            'flex items-center gap-2 w-full rounded-lg transition-colors',
            'bg-brand-600/10 text-brand-400 hover:bg-brand-600/20 border border-brand-600/20',
            sidebarOpen ? 'px-3 py-2 text-sm' : 'justify-center p-2',
          )}
        >
          <Plus size={16} />
          {sidebarOpen && <span>New Epic</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg transition-colors text-sm',
                sidebarOpen ? 'px-3 py-2' : 'justify-center p-2',
                isActive
                  ? 'bg-surface-3 text-gray-100'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-surface-2',
              )
            }
          >
            <item.icon size={18} />
            {sidebarOpen && (
              <>
                <span className="flex-1">{item.label}</span>
                <kbd className="hidden lg:inline">{item.shortcut}</kbd>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / User */}
      <div className="px-3 py-3 border-t border-border-muted">
        <div
          className={cn(
            'flex items-center gap-2.5',
            sidebarOpen ? 'px-3 py-2' : 'justify-center py-2',
          )}
        >
          <div className="w-7 h-7 rounded-full bg-surface-3 flex items-center justify-center text-xs font-medium text-gray-400 shrink-0">
            {login?.[0]?.toUpperCase() ?? '?'}
          </div>
          {sidebarOpen && (
            <>
              <span className="text-sm text-gray-300 truncate flex-1">{login}</span>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-red-400 transition-colors p-1"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
