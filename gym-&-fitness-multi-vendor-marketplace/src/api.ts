const API_BASE = '/api/v1';

function getToken(): string | null {
  const raw = localStorage.getItem('vyta_token');
  return raw || null;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  // --- Auth ---
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string; role: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: {
    email: string;
    password: string;
    role: 'customer' | 'vendor';
    first_name?: string;
    last_name?: string;
    business_name?: string;
    full_name?: string;
    emirates_id?: string;
    contact_mobile?: string;
    contact_landline?: string;
    address?: string;
  }) =>
    request<{ access_token: string; token_type: string; role: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () =>
    request<{ id: string; email: string; role: string; is_active: boolean }>('/auth/me'),

  // --- Products ---
  getProducts: (params?: { vendor_id?: string; search?: string; is_available?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.vendor_id) query.set('vendor_id', params.vendor_id);
    if (params?.search) query.set('search', params.search);
    if (params?.is_available !== undefined) query.set('is_available', String(params.is_available));
    const qs = query.toString();
    return request<ApiProductResponse[]>(`/products${qs ? `?${qs}` : ''}`);
  },

  getProduct: (id: string) =>
    request<ApiProductResponse>(`/products/${id}`),

  createProduct: (data: Partial<ApiProductResponse>) =>
    request<ApiProductResponse>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id: string, data: Partial<ApiProductResponse>) =>
    request<ApiProductResponse>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: string) =>
    request<{ ok: boolean }>(`/products/${id}`, {
      method: 'DELETE',
    }),

  // --- Orders ---
  createOrder: (data: { items: { product_id: string; quantity: number }[] }) =>
    request<ApiOrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getOrders: () =>
    request<ApiOrderResponse[]>('/orders'),

  getOrder: (id: string) =>
    request<ApiOrderResponse>(`/orders/${id}`),

  // --- Customers ---
  getCustomerProfile: () =>
    request<ApiCustomerResponse>('/customers/me'),

  updateCustomerProfile: (data: Partial<ApiCustomerResponse>) =>
    request<ApiCustomerResponse>('/customers/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getCustomerOrders: () =>
    request<ApiOrderResponse[]>('/customers/orders'),

  // --- Vendors ---
  getVendorProfile: () =>
    request<ApiVendorResponse>('/vendors/me'),

  registerVendor: (data: {
    email: string;
    password: string;
    business_name: string;
    description?: string;
    full_name?: string;
    emirates_id?: string;
    contact_mobile?: string;
    contact_landline?: string;
    address?: string;
  }) =>
    request<ApiVendorResponse>('/vendors/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getVendorLedger: () =>
    request<ApiTransactionResponse[]>('/vendors/ledger'),

  uploadVendorDocument: (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/vendors/documents/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Upload failed');
      }
      return res.json();
    });
  },

  // --- Health ---
  health: () =>
    request<{ status: string }>('/health', { cache: 'no-store' }),
};

// Response type helpers
export interface ApiProductResponse {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  is_available: boolean;
  created_at: string;
  vendor_name?: string;
  category?: string;
}

export interface ApiOrderResponse {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: ApiOrderItemResponse[];
}

export interface ApiOrderItemResponse {
  id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  product_name?: string;
}

export interface ApiCustomerResponse {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  shipping_address?: string;
  created_at: string;
}

export interface ApiVendorResponse {
  id: string;
  user_id: string;
  business_name: string;
  description?: string;
  logo_url?: string;
  onboarding_status: string;
  current_balance: number;
  created_at: string;
}

export interface ApiTransactionResponse {
  id: string;
  vendor_id: string;
  order_id?: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  created_at: string;
}
