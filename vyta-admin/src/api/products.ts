import { apiFetch } from './client';
import type { ProductResponse } from './types';

export function listProducts(): Promise<ProductResponse[]> {
  return apiFetch<ProductResponse[]>('/admin/products');
}
