import apiClient from './client';
import type { LoginResponse, AdminProfile } from '@/src/types';

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    return res.data;
  },

  getMe: async (): Promise<AdminProfile> => {
    const res = await apiClient.get<AdminProfile>('/auth/me');
    return res.data;
  },

  updateProfile: async (data: { email?: string; password?: string }): Promise<AdminProfile> => {
    const res = await apiClient.put<AdminProfile>('/admin/me', data);
    return res.data;
  },
};
