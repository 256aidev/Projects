import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const isParent = user?.role === 'parent';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="text-xl font-bold text-indigo-700">
            ChoreQuest
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 md:flex">
            <Link
              to="/dashboard"
              className="text-sm font-medium text-gray-600 hover:text-indigo-600"
            >
              Dashboard
            </Link>
            {isParent && (
              <>
                <Link
                  to="/chores"
                  className="text-sm font-medium text-gray-600 hover:text-indigo-600"
                >
                  Chores
                </Link>
                <Link
                  to="/household"
                  className="text-sm font-medium text-gray-600 hover:text-indigo-600"
                >
                  Household
                </Link>
              </>
            )}
            <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
              <NotificationBell />
              <span className="text-sm text-gray-500">
                {user?.display_name}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <NotificationBell />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex flex-col gap-1"
              aria-label="Toggle menu"
            >
              <span
                className={`h-0.5 w-5 bg-gray-600 transition-transform ${menuOpen ? 'translate-y-1.5 rotate-45' : ''}`}
              />
              <span
                className={`h-0.5 w-5 bg-gray-600 transition-opacity ${menuOpen ? 'opacity-0' : ''}`}
              />
              <span
                className={`h-0.5 w-5 bg-gray-600 transition-transform ${menuOpen ? '-translate-y-1.5 -rotate-45' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-gray-100 px-4 py-3 md:hidden">
            <Link
              to="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm font-medium text-gray-600"
            >
              Dashboard
            </Link>
            {isParent && (
              <>
                <Link
                  to="/chores"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-gray-600"
                >
                  Chores
                </Link>
                <Link
                  to="/household"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-gray-600"
                >
                  Household
                </Link>
              </>
            )}
            <div className="mt-2 border-t border-gray-100 pt-2">
              <p className="py-1 text-sm text-gray-500">
                {user?.display_name}
              </p>
              <button
                onClick={handleLogout}
                className="py-2 text-sm font-medium text-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
