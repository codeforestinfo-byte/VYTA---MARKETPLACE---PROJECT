import { apiFetch } from './client';
import type { WithdrawalResponse } from './types';

export interface ListWithdrawalsParams {
  status?: string;
  vendor_id?: string;
}

export function listWithdrawals(params?: ListWithdrawalsParams): Promise<WithdrawalResponse[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.vendor_id) qs.set('vendor_id', params.vendor_id);
  const qstr = qs.toString();
  return apiFetch<WithdrawalResponse[]>(`/admin/withdrawals${qstr ? '?' + qstr : ''}`);
}

export function approveWithdrawal(id: string): Promise<WithdrawalResponse> {
  return apiFetch<WithdrawalResponse>(`/admin/withdrawals/${id}/approve`, { method: 'POST' });
}

export function rejectWithdrawal(id: string): Promise<WithdrawalResponse> {
  return apiFetch<WithdrawalResponse>(`/admin/withdrawals/${id}/reject`, { method: 'POST' });
}
