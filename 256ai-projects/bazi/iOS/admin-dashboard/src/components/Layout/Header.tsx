import type { AdminUser } from '../../types';

interface HeaderProps {
  admin: AdminUser | null;
  onLogout: () => void;
}

export function Header({ admin, onLogout }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        {admin && (
          <>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{admin.name}</p>
              <p className="text-xs text-gray-500">{admin.role}</p>
            </div>
            <button
              onClick={onLogout}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
