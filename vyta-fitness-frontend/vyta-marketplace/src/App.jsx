import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminLoginPage from './pages/AdminLoginPage';

import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerConsultations from './pages/customer/CustomerConsultations';
import CustomerProfile from './pages/customer/CustomerProfile';

import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorDocuments from './pages/vendor/VendorDocuments';
import VendorLedger from './pages/vendor/VendorLedger';
import VendorWithdrawals from './pages/vendor/VendorWithdrawals';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOverview from './pages/admin/AdminOverview';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminVendors from './pages/admin/AdminVendors';
import AdminProducts from './pages/admin/AdminProducts';
import AdminConsultations from './pages/admin/AdminConsultations';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminProfile from './pages/admin/AdminProfile';

export default function App() {
  const { token, fetchUser } = useAuthStore();

  useEffect(() => {
    if (token) fetchUser();
  }, [token, fetchUser]);

  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute roles={['customer']}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard/orders" replace />} />
          <Route path="orders" element={<CustomerOrders />} />
          <Route path="consultations" element={<CustomerConsultations />} />
          <Route path="profile" element={<CustomerProfile />} />
        </Route>

        <Route
          path="/vendor/dashboard"
          element={
            <ProtectedRoute roles={['vendor']}>
              <VendorDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/vendor/products" replace />} />
          <Route path="products" element={<VendorProducts />} />
          <Route path="documents" element={<VendorDocuments />} />
          <Route path="ledger" element={<VendorLedger />} />
          <Route path="withdrawals" element={<VendorWithdrawals />} />
        </Route>

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="vendors" element={<AdminVendors />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="consultations" element={<AdminConsultations />} />
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
