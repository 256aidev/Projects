import { useAuth } from '../context/AuthContext';
import ParentDashboardPage from './ParentDashboardPage';
import ChildDashboardPage from './ChildDashboardPage';

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'parent') {
    return <ParentDashboardPage />;
  }

  return <ChildDashboardPage />;
}
