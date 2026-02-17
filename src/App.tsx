import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import { PatModal } from '@/components/pat/PatModal';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { EpicList } from '@/pages/EpicList';
import { EpicCreate } from '@/pages/EpicCreate';
import { EpicDetail } from '@/pages/EpicDetail';
import { TaskDetail } from '@/pages/TaskDetail';
import { Settings } from '@/pages/Settings';

export default function App() {
  const { restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <BrowserRouter>
      <PatModal />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/epics" element={<EpicList />} />
          <Route path="/epics/new" element={<EpicCreate />} />
          <Route path="/epics/:epicId" element={<EpicDetail />} />
          <Route path="/epics/:epicId/tasks/:taskId" element={<TaskDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a1a24',
            color: '#e2e8f0',
            border: '1px solid #2e2e48',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
    </BrowserRouter>
  );
}
