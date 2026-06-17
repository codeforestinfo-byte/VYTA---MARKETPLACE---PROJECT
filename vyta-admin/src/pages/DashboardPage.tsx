import { useEffect, useState } from 'react';
import { adminApi } from '@/src/api/admin';
import StatCard from '@/src/components/StatCard';
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DashboardStats } from '@/src/types';

const CHART_DATA = [
  { month: 'Jan', revenue: 0, orders: 0 },
  { month: 'Feb', revenue: 0, orders: 0 },
  { month: 'Mar', revenue: 0, orders: 0 },
  { month: 'Apr', revenue: 0, orders: 0 },
  { month: 'May', revenue: 0, orders: 0 },
  { month: 'Jun', revenue: 0, orders: 0 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboardStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const cards = [
    { title: 'Total Customers', value: stats?.total_customers ?? 0, icon: Users, color: 'bg-blue-600' },
    { title: 'Total Vendors', value: stats?.total_vendors ?? 0, icon: Store, color: 'bg-green-600' },
    { title: 'Total Products', value: stats?.total_products ?? 0, icon: Package, color: 'bg-purple-600' },
    { title: 'Total Orders', value: stats?.total_orders ?? 0, icon: ShoppingCart, color: 'bg-orange-600' },
    { title: 'Total Revenue', value: `$${Number(stats?.total_revenue ?? 0).toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-600' },
    { title: 'Pending Withdrawals', value: stats?.pending_withdrawals ?? 0, icon: Clock, color: 'bg-yellow-600' },
    { title: 'Pending Vendors', value: stats?.pending_vendors ?? 0, icon: AlertTriangle, color: 'bg-red-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} name="Revenue ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Statistics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#6366f1" name="Orders" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats && stats.recent_orders && stats.recent_orders.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Order ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                    <td className="py-3 px-4">${Number(order.total_amount).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
