import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { AdminUser } from '../../types';

interface LayoutProps {
  admin: AdminUser | null;
  onLogout: () => void;
}

export function Layout({ admin, onLogout }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header admin={admin} onLogout={onLogout} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
