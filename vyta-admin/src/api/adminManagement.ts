import { apiFetch } from './client';
import type {
  PermissionResponse, PermissionCreate, PermissionsByRoleResponse,
  InvitationListResponse, InvitationCreate, AdminInvitationResponse,
  AdminProfileResponse, AdminProfileUpdate,
  ForceActionResponse,
  AccountLockoutResponse,
  AdminApprovalResponse,
  TimelineEvent,
  RetentionConfigResponse, RetentionConfigUpdate,
  SessionPolicyResponse, SessionPolicyUpdate,
  IPAllowlistEntryResponse, IPAllowlistCreate,
  BulkImportItem, BulkImportResponse,
} from './types';

// ─── Role & Permissions ────────────────────────────

export function listRolePermissions(params?: {
  role?: string;
  module?: string;
}): Promise<PermissionResponse[]> {
  const sp = new URLSearchParams();
  if (params?.role) sp.set('role', params.role);
  if (params?.module) sp.set('module', params.module);
  const qs = sp.toString();
  return apiFetch<PermissionResponse[]>(`/admin/role-permissions${qs ? `?${qs}` : ''}`);
}

export function getPermissionsByRole(): Promise<PermissionsByRoleResponse[]> {
  return apiFetch<PermissionsByRoleResponse[]>('/admin/permissions-by-role');
}

export function createRolePermission(data: PermissionCreate): Promise<PermissionResponse> {
  return apiFetch<PermissionResponse>('/admin/role-permissions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteRolePermission(id: string): Promise<void> {
  return apiFetch<void>(`/admin/role-permissions/${id}`, { method: 'DELETE' });
}

// ─── Invitations ─────────────────────────────────

export function listInvitations(params?: {
  status?: string;
  skip?: number;
  limit?: number;
}): Promise<InvitationListResponse> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.skip !== undefined) sp.set('skip', String(params.skip));
  if (params?.limit !== undefined) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  return apiFetch<InvitationListResponse>(`/admin/invitations${qs ? `?${qs}` : ''}`);
}

export function createInvitation(data: InvitationCreate): Promise<AdminInvitationResponse> {
  return apiFetch<AdminInvitationResponse>('/admin/invitations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function resendInvitation(id: string): Promise<AdminInvitationResponse> {
  return apiFetch<AdminInvitationResponse>(`/admin/invitations/${id}/resend`, { method: 'POST' });
}

export function cancelInvitation(id: string): Promise<void> {
  return apiFetch<void>(`/admin/invitations/${id}`, { method: 'DELETE' });
}

// ─── Admin Profile ───────────────────────────────

export function getAdminProfile(): Promise<AdminProfileResponse> {
  return apiFetch<AdminProfileResponse>('/admin/me');
}

export function updateAdminProfile(data: AdminProfileUpdate): Promise<AdminProfileResponse> {
  return apiFetch<AdminProfileResponse>('/admin/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function getMySessions(): Promise<import('./types').AdminSessionResponse[]> {
  return apiFetch<import('./types').AdminSessionResponse[]>('/admin/me/sessions');
}

export function revokeMySession(id: string): Promise<{ detail: string }> {
  return apiFetch<{ detail: string }>(`/admin/me/sessions/${id}/revoke`, { method: 'POST' });
}

// ─── Force Actions ──────────────────────────────

export function listForceActions(userId: string): Promise<ForceActionResponse[]> {
  return apiFetch<ForceActionResponse[]>(`/admin/users/${userId}/force-actions`);
}

export function forcePasswordReset(userId: string): Promise<{ detail: string }> {
  return apiFetch<{ detail: string }>(`/admin/users/${userId}/force-password-reset`, { method: 'POST' });
}

export function forceMfaEnrollment(userId: string): Promise<{ detail: string }> {
  return apiFetch<{ detail: string }>(`/admin/users/${userId}/force-mfa-enrollment`, { method: 'POST' });
}

export function forceEmailVerification(userId: string): Promise<{ detail: string }> {
  return apiFetch<{ detail: string }>(`/admin/users/${userId}/force-email-verification`, { method: 'POST' });
}

// ─── Account Lockout ────────────────────────────

export function listAccountLockouts(params?: {
  locked_only?: boolean;
  skip?: number;
  limit?: number;
}): Promise<AccountLockoutResponse[]> {
  const sp = new URLSearchParams();
  if (params?.locked_only) sp.set('locked_only', 'true');
  if (params?.skip !== undefined) sp.set('skip', String(params.skip));
  if (params?.limit !== undefined) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  return apiFetch<AccountLockoutResponse[]>(`/admin/lockouts${qs ? `?${qs}` : ''}`);
}

export function unlockAccount(adminId: string): Promise<{ detail: string }> {
  return apiFetch<{ detail: string }>(`/admin/lockouts/${adminId}/unlock`, { method: 'POST' });
}

// ─── Approval Workflow ──────────────────────────

export function listApprovals(params?: {
  status?: string;
  skip?: number;
  limit?: number;
}): Promise<AdminApprovalResponse[]> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.skip !== undefined) sp.set('skip', String(params.skip));
  if (params?.limit !== undefined) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  return apiFetch<AdminApprovalResponse[]>(`/admin/approvals${qs ? `?${qs}` : ''}`);
}

export function approveApproval(id: string, notes?: string): Promise<{ detail: string }> {
  return apiFetch<{ detail: string }>(`/admin/approvals/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notes: notes || null }),
  });
}

export function rejectApproval(id: string, notes?: string): Promise<{ detail: string }> {
  return apiFetch<{ detail: string }>(`/admin/approvals/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ notes: notes || null }),
  });
}

// ─── Timeline ───────────────────────────────────

export function getUserTimeline(userId: string, limit?: number): Promise<TimelineEvent[]> {
  const sp = new URLSearchParams();
  if (limit !== undefined) sp.set('limit', String(limit));
  const qs = sp.toString();
  return apiFetch<TimelineEvent[]>(`/admin/users/${userId}/timeline${qs ? `?${qs}` : ''}`);
}

// ─── Audit Log Export & Retention ──────────────

export function downloadAuditLogsCsv(params?: {
  action?: string;
  resource_type?: string;
}) {
  const sp = new URLSearchParams();
  if (params?.action) sp.set('action', params.action);
  if (params?.resource_type) sp.set('resource_type', params.resource_type);
  const qs = sp.toString();
  const token = localStorage.getItem('vyta_admin_token');
  window.open(`/api/v1/admin/audit-logs/export/csv${qs ? `?${qs}` : ''}`, '_blank');
}

export function getRetentionConfig(): Promise<RetentionConfigResponse> {
  return apiFetch<RetentionConfigResponse>('/admin/audit-logs/retention-config');
}

export function updateRetentionConfig(data: RetentionConfigUpdate): Promise<RetentionConfigResponse> {
  return apiFetch<RetentionConfigResponse>('/admin/audit-logs/retention-config', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function cleanupAuditLogs(): Promise<{ detail: string }> {
  return apiFetch<{ detail: string }>('/admin/audit-logs/cleanup', { method: 'POST' });
}

// ─── Session Policies ───────────────────────────

export function getSessionPolicy(): Promise<SessionPolicyResponse> {
  return apiFetch<SessionPolicyResponse>('/admin/session-policy');
}

export function updateSessionPolicy(data: SessionPolicyUpdate): Promise<SessionPolicyResponse> {
  return apiFetch<SessionPolicyResponse>('/admin/session-policy', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function revokeAllAdminSessions(adminId: string): Promise<{ detail: string }> {
  return apiFetch<{ detail: string }>(`/admin/sessions/revoke-all/${adminId}`, { method: 'POST' });
}

// ─── Bulk Import ───────────────────────────────

export function bulkImportUsers(data: BulkImportItem[]): Promise<BulkImportResponse> {
  return apiFetch<BulkImportResponse>('/admin/users/bulk-import', {
    method: 'POST',
    body: JSON.stringify({ users: data }),
  });
}

// ─── IP Allowlist ──────────────────────────────

export function listIPAllowlist(): Promise<IPAllowlistEntryResponse[]> {
  return apiFetch<IPAllowlistEntryResponse[]>('/admin/ip-allowlist');
}

export function addIPAllowlistEntry(data: IPAllowlistCreate): Promise<IPAllowlistEntryResponse> {
  return apiFetch<IPAllowlistEntryResponse>('/admin/ip-allowlist', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function removeIPAllowlistEntry(id: string): Promise<void> {
  return apiFetch<void>(`/admin/ip-allowlist/${id}`, { method: 'DELETE' });
}

export function toggleIPAllowlistEntry(id: string): Promise<IPAllowlistEntryResponse> {
  return apiFetch<IPAllowlistEntryResponse>(`/admin/ip-allowlist/${id}/toggle`, { method: 'PUT' });
}

// ─── Admin 2FA / MFA ─────────────────────────────

export function setupAdminMFA(): Promise<{ secret: string; provisioning_uri: string; qr_code_url: string }> {
  return apiFetch('/auth/admin/mfa/setup', { method: 'POST' });
}

export function verifyAdminMFASetup(code: string): Promise<{ message: string; mfa_enabled: boolean }> {
  return apiFetch('/auth/admin/mfa/verify-setup', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export function disableAdminMFA(): Promise<{ message: string; mfa_enabled: boolean }> {
  return apiFetch('/auth/admin/mfa/disable', { method: 'POST' });
}

export function getAdminMFAStatus(): Promise<{ mfa_enabled: boolean; email: string }> {
  return apiFetch('/auth/admin/mfa/status');
}
