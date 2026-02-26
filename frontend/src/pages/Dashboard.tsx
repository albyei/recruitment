import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  // Redirect to the first role's dashboard
  if (user.roles.includes('hr')) return <Navigate to="/hr" replace />;
  if (user.roles.includes('hiring-manager')) return <Navigate to="/hiring-manager" replace />;
  if (user.roles.includes('admin')) return <Navigate to="/admin" replace />;

  return <Navigate to="/login" replace />;
}
