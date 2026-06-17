import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/src/context/AuthContext';
import ProtectedRoute from '@/src/components/ProtectedRoute';
import AdminLayout from '@/src/layouts/AdminLayout';
import LoginPage from '@/src/pages/LoginPage';
import DashboardPage from '@/src/pages/DashboardPage';
import VendorsPage from '@/src/pages/VendorsPage';
import ProductsPage from '@/src/pages/ProductsPage';
import OrdersPage from '@/src/pages/OrdersPage';
import CustomersPage from '@/src/pages/CustomersPage';
import WithdrawalsPage from '@/src/pages/WithdrawalsPage';
import ConsultationsPage from '@/src/pages/ConsultationsPage';
import ReportsPage from '@/src/pages/ReportsPage';
import SettingsPage from '@/src/pages/SettingsPage';
import ProfilePage from '@/src/pages/ProfilePage';

function AdminRoutes() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<DashboardPage />} />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="withdrawals" element={<WithdrawalsPage />} />
        <Route path="consultations" element={<ConsultationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AdminRoutes />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
