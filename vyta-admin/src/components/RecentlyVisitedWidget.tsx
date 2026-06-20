import { useState, useEffect } from 'react';
import { getDashboardStats } from '../api/dashboard';
import { listVendors } from '../api/vendors';
import { listProducts } from '../api/products';
import { listConsultations } from '../api/consultations';
import { listCustomers } from '../api/customers';
import type { DashboardStats, VendorResponse, ProductResponse, ConsultationResponse, CustomerResponse } from '../api/types';

interface RecentlyVisitedWidgetProps {
  onOpenAllServices: () => void;
  searchFilter?: string;
}

interface StatItem {
  name: string;
  href: string;
  letter: string;
  color: string;
  getValue: (stats: DashboardStats, vendors: VendorResponse[], products: ProductResponse[], consultations: ConsultationResponse[], customers: CustomerResponse[]) => string;
}

const STAT_ITEMS: StatItem[] = [
  {
    name: 'Total Customers',
    href: '/customers',
    letter: 'C',
    color: '#3b82f6',
    getValue: (stats) => stats.total_customers.toLocaleString(),
  },
  {
    name: 'Total Vendors',
    href: '/vendors',
    letter: 'V',
    color: '#f97316',
    getValue: (stats) => stats.total_vendors.toLocaleString(),
  },
  {
    name: 'Total Products',
    href: '/products',
    letter: 'P',
    color: '#10b981',
    getValue: (stats) => stats.total_products.toLocaleString(),
  },
  {
    name: 'Total Orders',
    href: '/orders',
    letter: 'O',
    color: '#8b5cf6',
    getValue: (stats) => stats.total_orders.toLocaleString(),
  },
  {
    name: 'Total Revenue',
    href: '/orders',
    letter: '$',
    color: '#ec4899',
    getValue: (stats) => `$${Number(stats.total_revenue).toLocaleString()}`,
  },
  {
    name: 'Pending Vendors',
    href: '/vendors',
    letter: 'P',
    color: '#ef4444',
    getValue: (stats) => stats.pending_vendors.toLocaleString(),
  },
  {
    name: 'Pending Withdrawals',
    href: '/withdrawals',
    letter: 'W',
    color: '#f59e0b',
    getValue: (stats) => stats.pending_withdrawals.toLocaleString(),
  },
  {
    name: 'Recent Orders',
    href: '/orders',
    letter: 'R',
    color: '#6366f1',
    getValue: (stats) => stats.recent_orders.length.toLocaleString(),
  },
  {
    name: 'Approved Vendors',
    href: '/vendors',
    letter: 'A',
    color: '#2563eb',
    getValue: (_, vendors) => vendors.filter(v => v.onboarding_status === 'approved').length.toLocaleString(),
  },
  {
    name: 'Active Products',
    href: '/products',
    letter: 'A',
    color: '#059669',
    getValue: (_, __, products) => products.filter(p => p.is_available).length.toLocaleString(),
  },
  {
    name: 'Low Stock Items',
    href: '/products',
    letter: '!',
    color: '#dc2626',
    getValue: (_, __, products) => products.filter(p => p.stock_quantity < 5).length.toLocaleString(),
  },
  {
    name: 'Vendor Balance',
    href: '/vendors',
    letter: 'B',
    color: '#7c3aed',
    getValue: (_, vendors) => {
      const total = vendors.reduce((sum, v) => sum + Number(v.current_balance), 0);
      return `$${total.toLocaleString()}`;
    },
  },
  {
    name: 'Total Users',
    href: '/',
    letter: 'D',
    color: '#0ea5e9',
    getValue: (stats) => (stats.total_customers + stats.total_vendors).toLocaleString(),
  },
  {
    name: 'Total Consultations',
    href: '/consultations',
    letter: 'N',
    color: '#14b8a6',
    getValue: (_, __, ___, consultations) => consultations.length.toLocaleString(),
  },
  {
    name: 'Pending Consultations',
    href: '/consultations',
    letter: 'N',
    color: '#f43f5e',
    getValue: (_, __, ___, consultations) => consultations.filter(c => c.status === 'scheduled' || c.status === 'pending').length.toLocaleString(),
  },
  {
    name: 'Verified Customers',
    href: '/user-management',
    letter: 'U',
    color: '#8b5cf6',
    getValue: (_, __, ___, ____, customers) => customers.filter(c => c.is_email_verified).length.toLocaleString(),
  },
];

function getIconColor(index: number): string {
  const colors = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#6366f1', '#2563eb', '#059669', '#dc2626', '#7c3aed'];
  return colors[index % colors.length];
}

function getLetter(name: string): string {
  const words = name.split(' ');
  if (words.length >= 2) return words[0][0] + words[1][0];
  return name.slice(0, 2);
}

export default function RecentlyVisitedWidget({
  onOpenAllServices,
  searchFilter = ''
}: RecentlyVisitedWidgetProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vendors, setVendors] = useState<VendorResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [consultations, setConsultations] = useState<ConsultationResponse[]>([]);
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, vendorsData, productsData, consultationsData, customersData] = await Promise.all([
          getDashboardStats(),
          listVendors(),
          listProducts(),
          listConsultations(),
          listCustomers(),
        ]);
        setStats(statsData);
        setVendors(vendorsData);
        setProducts(productsData);
        setConsultations(consultationsData);
        setCustomers(customersData);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredItems = STAT_ITEMS.filter(item =>
    item.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 my-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center py-0.5 px-1 -mx-1 animate-pulse">
            <div className="w-5 h-5 rounded-[2px] bg-gray-200 shrink-0 mr-2.5" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-6 text-gray-400 text-[13px]">
        Unable to load dashboard data.
        <button onClick={() => window.location.reload()} className="ml-2 text-aws-blue-accent hover:underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 my-1.5">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, idx) => (
            <a
              key={item.name}
              href={item.href}
              className="flex items-center justify-between group py-0.5 focus:outline-none focus:ring-1 focus:ring-aws-blue-accent rounded px-1 -mx-1"
            >
              <div className="flex items-center min-w-0 flex-1">
                <div
                  className="w-5 h-5 flex items-center justify-center rounded-[2px] text-[10px] font-mono font-bold text-white shrink-0 mr-2.5 shadow-sm transform group-hover:scale-105 duration-200"
                  style={{ backgroundColor: item.color }}
                >
                  {item.letter}
                </div>
                <span className="text-aws-blue-accent hover:underline decoration-aws-blue-accent font-medium text-[13px] tracking-tight truncate transition-all duration-200 ease-in-out">
                  {item.name}
                </span>
              </div>
              <span className="text-[13px] font-semibold text-gray-700 ml-2 shrink-0">
                {item.getValue(stats, vendors, products, consultations, customers)}
              </span>
            </a>
          ))
        ) : (
          <div className="col-span-2 text-center py-6 text-gray-400">
            No matching items found.
          </div>
        )}
      </div>

      <div className="border-t border-aws-border pt-3 mt-4 flex items-center justify-center">
        <button
          onClick={onOpenAllServices}
          className="text-aws-blue-accent hover:underline text-[13px] font-semibold transition-all duration-200 ease-in-out focus:outline-none"
        >
          View all orders
        </button>
      </div>
    </div>
  );
}
