import { type ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import MFAVerifyPage from './pages/MFAVerifyPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import Dashboard from './pages/Dashboard';
import OrdersPage from './pages/OrdersPage';
import VendorsPage from './pages/VendorsPage';
import CustomersPage from './pages/CustomersPage';
import ProductsPage from './pages/ProductsPage';
import WithdrawalsPage from './pages/WithdrawalsPage';
import ConsultationsPage from './pages/ConsultationsPage';
import UserManagementPage from './pages/UserManagementPage';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { adminUser, pendingMFA, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <div className="text-gray-900 text-lg">Loading...</div>
      </div>
    );
  }

  if (pendingMFA) {
    return <Navigate to="/2fa-verify" replace />;
  }

  if (!adminUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { adminUser, pendingMFA, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <div className="text-gray-900 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={adminUser || pendingMFA ? <Navigate to={pendingMFA ? '/2fa-verify' : '/'} replace /> : <Login />} />
      <Route path="/2fa-verify" element={<MFAVerifyPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="/vendors" element={<ProtectedRoute><VendorsPage /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
      <Route path="/withdrawals" element={<ProtectedRoute><WithdrawalsPage /></ProtectedRoute>} />
      <Route path="/consultations" element={<ProtectedRoute><ConsultationsPage /></ProtectedRoute>} />
      <Route path="/user-management" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
