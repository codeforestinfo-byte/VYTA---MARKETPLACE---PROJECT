import { apiFetch } from './client';
import type {
  VendorResponse, VendorDocumentResponse,
  AdminVendorCreate, AdminVendorUpdate, LedgerEntryResponse,
  ProductResponse, WithdrawalResponse,
  VendorAuditLogResponse, VendorLoginHistoryResponse, VendorSessionResponse
} from './types';

export interface ListVendorsParams {
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: string;
  skip?: number;
  limit?: number;
}

export function listVendors(params?: ListVendorsParams): Promise<VendorResponse[]> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.status) qs.set('status', params.status);
  if (params?.sort_by) qs.set('sort_by', params.sort_by);
  if (params?.sort_order) qs.set('sort_order', params.sort_order);
  if (params?.skip !== undefined) qs.set('skip', String(params.skip));
  if (params?.limit !== undefined) qs.set('limit', String(params.limit));
  const qstr = qs.toString();
  return apiFetch<VendorResponse[]>(`/admin/vendors${qstr ? '?' + qstr : ''}`);
}

export function getVendor(id: string): Promise<VendorResponse> {
  return apiFetch<VendorResponse>(`/admin/vendors/${id}`);
}

export function getVendorDocuments(id: string): Promise<VendorDocumentResponse[]> {
  return apiFetch<VendorDocumentResponse[]>(`/admin/vendors/${id}/documents`);
}

export function getVendorLedger(id: string): Promise<LedgerEntryResponse[]> {
  return apiFetch<LedgerEntryResponse[]>(`/admin/vendors/${id}/ledger`);
}

export function getVendorWithdrawals(id: string): Promise<WithdrawalResponse[]> {
  return apiFetch<WithdrawalResponse[]>(`/admin/vendors/${id}/withdrawals`);
}

export function getVendorProducts(id: string): Promise<ProductResponse[]> {
  return apiFetch<ProductResponse[]>(`/admin/vendors/${id}/products`);
}

export function createAdminVendor(body: AdminVendorCreate): Promise<VendorResponse> {
  return apiFetch<VendorResponse>('/admin/vendors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function updateAdminVendor(id: string, body: AdminVendorUpdate): Promise<VendorResponse> {
  return apiFetch<VendorResponse>(`/admin/vendors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function hardDeleteVendor(id: string): Promise<void> {
  return apiFetch<void>(`/admin/vendors/${id}/hard`, { method: 'DELETE' });
}

export function verifyVendor(id: string): Promise<VendorResponse> {
  return apiFetch<VendorResponse>(`/admin/vendors/${id}/verify`, { method: 'POST' });
}

export function rejectVendor(id: string): Promise<VendorResponse> {
  return apiFetch<VendorResponse>(`/admin/vendors/${id}/reject`, { method: 'POST' });
}

export function getVendorAuditLogs(id: string): Promise<VendorAuditLogResponse[]> {
  return apiFetch<VendorAuditLogResponse[]>(`/admin/vendors/${id}/audit-logs`);
}

export function getVendorLoginHistory(id: string, success?: boolean): Promise<VendorLoginHistoryResponse[]> {
  const qs = new URLSearchParams();
  if (success !== undefined) qs.set('success', String(success));
  const qstr = qs.toString();
  return apiFetch<VendorLoginHistoryResponse[]>(`/admin/vendors/${id}/login-history${qstr ? '?' + qstr : ''}`);
}

export function getVendorSessions(id: string, activeOnly?: boolean): Promise<VendorSessionResponse[]> {
  const qs = new URLSearchParams();
  if (activeOnly !== undefined) qs.set('active_only', String(activeOnly));
  const qstr = qs.toString();
  return apiFetch<VendorSessionResponse[]>(`/admin/vendors/${id}/sessions${qstr ? '?' + qstr : ''}`);
}

export function revokeVendorSession(vendorId: string, sessionId: string): Promise<void> {
  return apiFetch<void>(`/admin/vendors/${vendorId}/sessions/${sessionId}/revoke`, { method: 'POST' });
}

export function listAllVendorAuditLogs(params?: { vendor_id?: string; action?: string; resource_type?: string; skip?: number; limit?: number }): Promise<VendorAuditLogResponse[]> {
  const qs = new URLSearchParams();
  if (params?.vendor_id) qs.set('vendor_id', params.vendor_id);
  if (params?.action) qs.set('action', params.action);
  if (params?.resource_type) qs.set('resource_type', params.resource_type);
  if (params?.skip !== undefined) qs.set('skip', String(params.skip));
  if (params?.limit !== undefined) qs.set('limit', String(params.limit));
  const qstr = qs.toString();
  return apiFetch<VendorAuditLogResponse[]>(`/admin/vendor-audit-logs${qstr ? '?' + qstr : ''}`);
}

export function listAllVendorLoginHistory(params?: { vendor_id?: string; success?: boolean; skip?: number; limit?: number }): Promise<VendorLoginHistoryResponse[]> {
  const qs = new URLSearchParams();
  if (params?.vendor_id) qs.set('vendor_id', params.vendor_id);
  if (params?.success !== undefined) qs.set('success', String(params.success));
  if (params?.skip !== undefined) qs.set('skip', String(params.skip));
  if (params?.limit !== undefined) qs.set('limit', String(params.limit));
  const qstr = qs.toString();
  return apiFetch<VendorLoginHistoryResponse[]>(`/admin/vendor-login-history${qstr ? '?' + qstr : ''}`);
}

export function listAllVendorSessions(params?: { vendor_id?: string; active_only?: boolean; skip?: number; limit?: number }): Promise<VendorSessionResponse[]> {
  const qs = new URLSearchParams();
  if (params?.vendor_id) qs.set('vendor_id', params.vendor_id);
  if (params?.active_only !== undefined) qs.set('active_only', String(params.active_only));
  if (params?.skip !== undefined) qs.set('skip', String(params.skip));
  if (params?.limit !== undefined) qs.set('limit', String(params.limit));
  const qstr = qs.toString();
  return apiFetch<VendorSessionResponse[]>(`/admin/vendor-sessions${qstr ? '?' + qstr : ''}`);
}
