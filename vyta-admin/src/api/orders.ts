import { apiFetch } from './client';
import type { OrderSummary, OrderDetail } from './types';

export function listOrders(statusFilter?: string): Promise<OrderSummary[]> {
  const params = statusFilter ? `?status_filter=${statusFilter}` : '';
  return apiFetch<OrderSummary[]>(`/admin/orders${params}`);
}

export function getOrder(id: string): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/admin/orders/${id}`);
}
