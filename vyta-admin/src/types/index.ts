export type UserRole = 'admin' | 'vendor' | 'customer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_customers: number;
  total_vendors: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  pending_withdrawals: number;
  pending_vendors: number;
  recent_orders: Order[];
}

export interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  description: string | null;
  logo_url: string | null;
  full_name: string | null;
  emirates_id: string | null;
  contact_mobile: string | null;
  contact_landline: string | null;
  address: string | null;
  onboarding_status: 'pending' | 'approved' | 'rejected';
  current_balance: number;
  created_at: string;
  user?: User;
}

export interface VendorDocument {
  id: string;
  vendor_id: string;
  document_type: string;
  document_url: string;
  status: string;
  uploaded_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  vendor_name?: string;
  category?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  items?: OrderItem[];
  customer_name?: string;
  customer_email?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  product_name?: string;
}

export interface Customer {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  name?: string;
  store_role?: string;
  phone: string | null;
  shipping_address: string | null;
  is_email_verified?: boolean;
  mfa_enabled?: boolean;
  created_at: string;
  user?: User;
}

export interface WithdrawalRequest {
  id: string;
  vendor_id: string;
  amount: number;
  bank_details: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  processed_at: string | null;
  created_at: string;
  vendor_name?: string;
  vendor_business_name?: string;
}

export interface Consultation {
  id: string;
  customer_id: string;
  vendor_id: string;
  scheduled_at: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  meeting_link: string | null;
  notes: string | null;
  created_at: string;
  customer_name?: string;
  vendor_name?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
