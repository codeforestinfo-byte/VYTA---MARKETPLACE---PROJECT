import { apiFetch } from './client';
import type { ConsultationResponse } from './types';

export function listConsultations(statusFilter?: string): Promise<ConsultationResponse[]> {
  const params = statusFilter ? `?status_filter=${statusFilter}` : '';
  return apiFetch<ConsultationResponse[]>(`/admin/consultations${params}`);
}
