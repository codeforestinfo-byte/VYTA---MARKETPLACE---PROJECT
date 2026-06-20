import { apiFetch } from './client';
import type { CustomerResponse } from './types';

export function listCustomers(): Promise<CustomerResponse[]> {
  return apiFetch<CustomerResponse[]>('/admin/customers');
}
