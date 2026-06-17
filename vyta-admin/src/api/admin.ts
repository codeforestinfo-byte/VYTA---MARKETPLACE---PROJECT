import apiClient from './client';
import type {
  DashboardStats,
  Vendor,
  VendorDocument,
  Product,
  Order,
  Customer,
  WithdrawalRequest,
  Consultation,
} from '@/src/types';

export const adminApi = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<DashboardStats>('/admin/dashboard/stats');
    return res.data;
  },

  // Vendors
  getVendors: async (): Promise<Vendor[]> => {
    const res = await apiClient.get<Vendor[]>('/admin/vendors');
    return res.data;
  },

  getVendor: async (id: string): Promise<Vendor> => {
    const res = await apiClient.get<Vendor>(`/admin/vendors/${id}`);
    return res.data;
  },

  getVendorDocuments: async (vendorId: string): Promise<VendorDocument[]> => {
    const res = await apiClient.get<VendorDocument[]>(`/admin/vendors/${vendorId}/documents`);
    return res.data;
  },

  verifyVendor: async (vendorId: string): Promise<void> => {
    await apiClient.post(`/admin/vendors/${vendorId}/verify`);
  },

  rejectVendor: async (vendorId: string): Promise<void> => {
    await apiClient.post(`/admin/vendors/${vendorId}/reject`);
  },

  createVendor: async (data: {
    email: string;
    password: string;
    business_name: string;
    description?: string;
  }): Promise<Vendor> => {
    const res = await apiClient.post<Vendor>('/admin/vendors', data);
    return res.data;
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    const res = await apiClient.get<Product[]>('/admin/products');
    return res.data;
  },

  updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
    const res = await apiClient.put<Product>(`/admin/products/${id}`, data);
    return res.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/products/${id}`);
  },

  // Orders
  getOrders: async (status?: string): Promise<Order[]> => {
    const params = status ? { status_filter: status } : {};
    const res = await apiClient.get<Order[]>('/admin/orders', { params });
    return res.data;
  },

  getOrder: async (id: string): Promise<Order> => {
    const res = await apiClient.get<Order>(`/admin/orders/${id}`);
    return res.data;
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    const res = await apiClient.get<Customer[]>('/admin/customers');
    return res.data;
  },

  getCustomer: async (id: string): Promise<Customer> => {
    const res = await apiClient.get<Customer>(`/admin/customers/${id}`);
    return res.data;
  },

  // Withdrawals
  getWithdrawals: async (status?: string): Promise<WithdrawalRequest[]> => {
    const params = status ? { status_filter: status } : {};
    const res = await apiClient.get<WithdrawalRequest[]>('/admin/withdrawals', { params });
    return res.data;
  },

  approveWithdrawal: async (withdrawalId: string): Promise<void> => {
    await apiClient.post(`/admin/withdrawals/${withdrawalId}/approve`);
  },

  rejectWithdrawal: async (withdrawalId: string): Promise<void> => {
    await apiClient.post(`/admin/withdrawals/${withdrawalId}/reject`);
  },

  // Consultations
  getConsultations: async (status?: string): Promise<Consultation[]> => {
    const params = status ? { status_filter: status } : {};
    const res = await apiClient.get<Consultation[]>('/admin/consultations', { params });
    return res.data;
  },

  updateConsultation: async (id: string, data: { status?: string; notes?: string }): Promise<Consultation> => {
    const res = await apiClient.put<Consultation>(`/admin/consultations/${id}`, data);
    return res.data;
  },
};
