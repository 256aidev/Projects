import { useState, useCallback } from 'react';
import type { TabId } from './types';
import { api } from './api';
import { usePolling } from './hooks';
import Header from './components/Header';
import DashboardTab from './components/DashboardTab';
import TasksTab from './components/TasksTab';
import MachinesTab from './components/MachinesTab';
import SettingsTab from './components/SettingsTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const health = usePolling(() => api.getHealthSummary().then((d) => { setLastUpdated(new Date()); return d; }), 5000);
  const workers = usePolling(() => api.getWorkers(), 5000);
  const tasks = usePolling(() => api.getTasks(50), 5000);
  const escalations = usePolling(() => api.getEscalations(), 5000);
  const projects = usePolling(() => api.getProjects(), 15000);
  const machines = usePolling(() => api.getMachines(), 10000);

  const connected = !health.error;

  const handleRemoveWorker = useCallback(async (id: string) => {
    try {
      await api.removeWorker(id);
      workers.refetch();
    } catch { /* ignore */ }
  }, [workers]);

  const handleCancelTask = useCallback(async (id: string) => {
    try {
      await api.cancelTask(id);
      tasks.refetch();
    } catch { /* ignore */ }
  }, [tasks]);

  const handleRetryTask = useCallback(async (id: string) => {
    try {
      await api.retryTask(id);
      tasks.refetch();
    } catch { /* ignore */ }
  }, [tasks]);

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        connected={connected}
        lastUpdated={lastUpdated}
      />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <DashboardTab
            health={health.data}
            workers={workers.data || []}
            tasks={tasks.data || []}
            escalations={escalations.data || []}
            onRemoveWorker={handleRemoveWorker}
            onCancelTask={handleCancelTask}
            onRetryTask={handleRetryTask}
          />
        )}
        {activeTab === 'tasks' && (
          <TasksTab
            tasks={tasks.data || []}
            projects={projects.data || []}
            onCancel={handleCancelTask}
            onRetry={handleRetryTask}
            onRefetch={tasks.refetch}
          />
        )}
        {activeTab === 'machines' && (
          <MachinesTab
            machines={machines.data || []}
            workers={workers.data || []}
          />
        )}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
}
