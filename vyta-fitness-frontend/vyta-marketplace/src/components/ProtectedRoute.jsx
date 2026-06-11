import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

export default function ProtectedRoute({ children, roles }) {
  const { token, role } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/" replace />;
  return children;
}
