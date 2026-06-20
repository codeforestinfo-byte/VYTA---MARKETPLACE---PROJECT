export interface Product {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  category: string;
  image: string;
  description: string;
  features: string[];
  stock: number;
  isDeal?: boolean;
}

export interface Vendor {
  id: string;
  storeName: string;
  email: string;
  logo: string;
  description: string;
  region: string;
  earnings: number;
  rating: number;
}

export interface User {
  email: string;
  name: string;
  role: 'buyer' | 'vendor';
  vendorId?: string;
  storeRole?: string;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  buyerEmail: string;
  buyerName: string;
  items: {
    productId: string;
    title: string;
    price: number;
    quantity: number;
    image: string;
    vendorId: string;
  }[];
  totalAmount: number;
  date: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered';
  deliveryAddress: string;
}

export interface RegistryItem {
  productId: string;
  wanted: number;
  received: number;
}

export interface Registry {
  id: string;
  title: string;
  creatorName: string;
  creatorEmail: string;
  type: 'Home Gym Project' | 'Commercial Fitness Studio' | 'Weight Loss Goal' | 'Strength Mastery Dream';
  items: RegistryItem[];
  date: string;
  description: string;
}

export interface ApiUser {
  id: string;
  email: string;
  role: 'admin' | 'vendor' | 'customer';
  is_active: boolean;
  created_at: string;
}

export interface ApiCustomer {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  shipping_address?: string;
  created_at: string;
}

export interface ApiVendor {
  id: string;
  user_id: string;
  business_name: string;
  description?: string;
  logo_url?: string;
  onboarding_status: 'pending' | 'approved' | 'rejected';
  current_balance: number;
  created_at: string;
}

export interface ApiProduct {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  is_available: boolean;
  created_at: string;
}

export interface ApiOrder {
  id: string;
  customer_id: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  items: ApiOrderItem[];
}

export interface ApiOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
}
