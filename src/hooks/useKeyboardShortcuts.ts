import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores/ui';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const toggleSidebar = useUIStore(s => s.toggleSidebar);
  const toggleCommandPalette = useUIStore(s => s.toggleCommandPalette);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.target as HTMLElement).isContentEditable) return;

      // Cmd/Ctrl + K -> Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // Cmd/Ctrl + B -> Toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // G then D -> Go to dashboard
      // G then E -> Go to epics
      // G then S -> Go to settings
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        const handleSecondKey = (e2: KeyboardEvent) => {
          document.removeEventListener('keydown', handleSecondKey);
          if (e2.key === 'd') navigate('/');
          else if (e2.key === 'e') navigate('/epics');
          else if (e2.key === 's') navigate('/settings');
        };
        document.addEventListener('keydown', handleSecondKey, { once: true });
        setTimeout(() => document.removeEventListener('keydown', handleSecondKey), 500);
        return;
      }

      // N -> New epic
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        navigate('/epics/new');
        return;
      }

      // ? -> Show shortcuts (handled by command palette)
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        toggleCommandPalette();
        return;
      }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate, toggleSidebar, toggleCommandPalette]);
}
