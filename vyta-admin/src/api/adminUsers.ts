import { apiFetch } from './client';
import type { AdminUserResponse, AdminUserListResponse, AdminUserCreate, AdminUserUpdate, AuditLogResponse, LoginHistoryResponse, AdminSessionResponse } from './types';

export function listAdminUsers(params?: {
  search?: string;
  role?: string;
  status?: string;
  created_after?: string;
  created_before?: string;
  sort_by?: string;
  sort_order?: string;
  skip?: number;
  limit?: number;
}): Promise<AdminUserListResponse> {
  const sp = new URLSearchParams();
  if (params?.search) sp.set('search', params.search);
  if (params?.role) sp.set('role', params.role);
  if (params?.status) sp.set('status', params.status);
  if (params?.created_after) sp.set('created_after', params.created_after);
  if (params?.created_before) sp.set('created_before', params.created_before);
  if (params?.sort_by) sp.set('sort_by', params.sort_by);
  if (params?.sort_order) sp.set('sort_order', params.sort_order);
  if (params?.skip !== undefined) sp.set('skip', String(params.skip));
  if (params?.limit !== undefined) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  return apiFetch<AdminUserListResponse>(`/admin/users${qs ? `?${qs}` : ''}`);
}

export function getAdminUser(userId: string): Promise<AdminUserResponse> {
  return apiFetch<AdminUserResponse>(`/admin/users/${userId}`);
}

export function createAdminUser(data: AdminUserCreate): Promise<AdminUserResponse> {
  return apiFetch<AdminUserResponse>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateAdminUser(userId: string, data: AdminUserUpdate): Promise<AdminUserResponse> {
  return apiFetch<AdminUserResponse>(`/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deactivateAdminUser(userId: string): Promise<void> {
  return apiFetch<void>(`/admin/users/${userId}`, { method: 'DELETE' });
}

export function reactivateAdminUser(userId: string): Promise<AdminUserResponse> {
  return apiFetch<AdminUserResponse>(`/admin/users/${userId}/reactivate`, { method: 'PUT' });
}

export function downloadAdminUsersCsv(params?: {
  search?: string;
  role?: string;
  status?: string;
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set('search', params.search);
  if (params?.role) sp.set('role', params.role);
  if (params?.status) sp.set('status', params.status);
  const qs = sp.toString();
  const token = localStorage.getItem('vyta_admin_token');
  const url = `/api/v1/admin/users/export/csv${qs ? `?${qs}` : ''}`;
  window.open(url, '_blank');
}

export function listAuditLogs(params?: {
  admin_id?: string;
  action?: string;
  resource_type?: string;
  skip?: number;
  limit?: number;
}): Promise<AuditLogResponse[]> {
  const sp = new URLSearchParams();
  if (params?.admin_id) sp.set('admin_id', params.admin_id);
  if (params?.action) sp.set('action', params.action);
  if (params?.resource_type) sp.set('resource_type', params.resource_type);
  if (params?.skip !== undefined) sp.set('skip', String(params.skip));
  if (params?.limit !== undefined) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  return apiFetch<AuditLogResponse[]>(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
}

export function listLoginHistory(params?: {
  admin_id?: string;
  success?: boolean;
  skip?: number;
  limit?: number;
}): Promise<LoginHistoryResponse[]> {
  const sp = new URLSearchParams();
  if (params?.admin_id) sp.set('admin_id', params.admin_id);
  if (params?.success !== undefined) sp.set('success', String(params.success));
  if (params?.skip !== undefined) sp.set('skip', String(params.skip));
  if (params?.limit !== undefined) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  return apiFetch<LoginHistoryResponse[]>(`/admin/login-history${qs ? `?${qs}` : ''}`);
}

export function listAdminSessions(params?: {
  admin_id?: string;
  active_only?: boolean;
  skip?: number;
  limit?: number;
}): Promise<AdminSessionResponse[]> {
  const sp = new URLSearchParams();
  if (params?.admin_id) sp.set('admin_id', params.admin_id);
  if (params?.active_only !== undefined) sp.set('active_only', String(params.active_only));
  if (params?.skip !== undefined) sp.set('skip', String(params.skip));
  if (params?.limit !== undefined) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  return apiFetch<AdminSessionResponse[]>(`/admin/sessions${qs ? `?${qs}` : ''}`);
}

export function revokeAdminSession(sessionId: string): Promise<{ detail: string }> {
  return apiFetch<{ detail: string }>(`/admin/sessions/${sessionId}/revoke`, { method: 'POST' });
}

export function hardDeleteAdminUser(userId: string): Promise<void> {
  return apiFetch<void>(`/admin/users/${userId}/hard`, { method: 'DELETE' });
}
