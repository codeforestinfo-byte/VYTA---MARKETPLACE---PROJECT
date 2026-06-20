export interface DashboardStats {
  total_customers: number;
  total_vendors: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  pending_vendors: number;
  pending_withdrawals: number;
  recent_orders: OrderSummary[];
}

export interface OrderSummary {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface OrderDetail {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItemResponse[];
}

export interface OrderItemResponse {
  product_name: string;
  quantity: number;
  price_at_purchase: number;
}

export interface VendorResponse {
  id: string;
  business_name: string;
  description: string | null;
  logo_url: string | null;
  full_name: string | null;
  emirates_id: string | null;
  contact_mobile: string | null;
  contact_landline: string | null;
  address: string | null;
  email: string | null;
  onboarding_status: string;
  current_balance: number;
  created_at: string;
}

export interface VendorDocumentResponse {
  id: string;
  vendor_id: string;
  document_type: string;
  document_url: string;
  status: string;
  uploaded_at: string;
}

export interface AdminVendorCreate {
  email: string;
  password: string;
  business_name: string;
  description?: string;
}

export interface AdminVendorUpdate {
  business_name?: string;
  description?: string;
  full_name?: string;
  emirates_id?: string;
  contact_mobile?: string;
  contact_landline?: string;
  address?: string;
}

export interface LedgerEntryResponse {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export interface CustomerResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string | null;
  store_role: string | null;
  phone: string | null;
  is_active: boolean;
  is_email_verified: boolean;
  mfa_enabled: boolean;
  created_at: string;
}

export interface CustomerDetail extends CustomerResponse {
  shipping_address: string | null;
  orders: OrderSummary[];
}

export interface ProductResponse {
  id: string;
  vendor_business_name: string;
  name: string;
  price: number;
  stock_quantity: number;
  is_available: boolean;
  created_at: string;
}

export interface WithdrawalResponse {
  id: string;
  vendor_id: string;
  amount: number;
  status: string;
  bank_details: Record<string, unknown>;
  created_at: string;
  processed_at: string | null;
}

export interface AdminUserResponse {
  id: string;
  email: string;
  name: string;
  store_role: string | null;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  is_super_admin: boolean;
  mfa_enabled: boolean;
  last_login: string | null;
  created_at: string;
}

export interface AdminUserListResponse {
  items: AdminUserResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminInvitationResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  invited_by: string;
  created_at: string;
}

export interface AuditLogResponse {
  id: string;
  admin_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface LoginHistoryResponse {
  id: string;
  admin_id: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

export interface AdminSessionResponse {
  id: string;
  admin_id: string;
  ip_address: string | null;
  user_agent: string | null;
  is_active: boolean;
  last_activity: string;
  created_at: string;
}

export interface AdminUserCreate {
  email: string;
  password: string;
  name: string;
  store_role: string;
}

export interface AdminUserUpdate {
  name?: string;
  store_role?: string;
  is_active?: boolean;
}

export interface VendorAuditLogResponse {
  id: string;
  vendor_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface VendorLoginHistoryResponse {
  id: string;
  vendor_id: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

export interface VendorSessionResponse {
  id: string;
  vendor_id: string;
  ip_address: string | null;
  user_agent: string | null;
  is_active: boolean;
  last_activity: string;
  created_at: string;
}

export interface ConsultationResponse {
  id: string;
  customer_name: string;
  vendor_business_name: string;
  scheduled_at: string;
  status: string;
  meeting_link: string | null;
  notes: string | null;
  created_at: string;
}

// ─── Role & Permissions ────────

export interface PermissionResponse {
  id: string;
  role: string;
  module: string;
  action: string;
  created_at: string;
}

export interface PermissionCreate {
  role: string;
  module: string;
  action: string;
}

export interface PermissionsByRoleResponse {
  role: string;
  permissions: { module: string; actions: string[] }[];
}

// ─── Invitations ───────────────

export interface InvitationListResponse {
  items: AdminInvitationResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface InvitationCreate {
  email: string;
  name: string;
  role: string;
}

// ─── Admin Profile ─────────────

export interface AdminProfileResponse {
  id: string;
  email: string;
  name: string;
  store_role: string | null;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  is_super_admin: boolean;
  mfa_enabled: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminProfileUpdate {
  name?: string;
  email?: string;
  current_password?: string;
  new_password?: string;
}

// ─── Force Actions ─────────────

export interface ForceActionResponse {
  id: string;
  admin_id: string;
  action_type: string;
  is_completed: boolean;
  forced_by: string;
  completed_at: string | null;
  created_at: string;
}

// ─── Account Lockout ───────────

export interface AccountLockoutResponse {
  id: string;
  admin_id: string;
  admin_name: string;
  admin_email: string;
  failed_attempts: number;
  locked_until: string | null;
  is_locked: boolean;
  last_failure_at: string | null;
  created_at: string;
}

// ─── Approval ──────────────────

export interface AdminApprovalResponse {
  id: string;
  admin_id: string;
  admin_name: string;
  admin_email: string;
  requested_role: string;
  status: string;
  approved_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
}

// ─── Timeline ──────────────────

export interface TimelineEvent {
  id: string;
  event_type: string;
  action: string;
  description: string;
  admin_id: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// ─── Retention ─────────────────

export interface RetentionConfigResponse {
  retention_days: number;
  auto_delete_enabled: boolean;
  last_cleaned_at: string | null;
}

export interface RetentionConfigUpdate {
  retention_days?: number;
  auto_delete_enabled?: boolean;
}

// ─── Session Policy ────────────

export interface SessionPolicyResponse {
  idle_timeout_minutes: number;
  max_concurrent_sessions: number;
  enforce_for_all: boolean;
}

export interface SessionPolicyUpdate {
  idle_timeout_minutes?: number;
  max_concurrent_sessions?: number;
  enforce_for_all?: boolean;
}

// ─── IP Allowlist ──────────────

export interface IPAllowlistEntryResponse {
  id: string;
  ip_address: string;
  description: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface IPAllowlistCreate {
  ip_address: string;
  description?: string;
}

// ─── Bulk Import ───────────────

export interface BulkImportItem {
  email: string;
  name: string;
  password: string;
  store_role: string;
}

export interface BulkImportResponse {
  total: number;
  succeeded: number;
  failed: number;
  errors: { email: string; error: string }[];
}
