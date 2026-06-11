import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/admin/dashboard/stats')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const cards = [
    { label: 'Total Customers', value: stats.total_customers, color: 'bg-blue-500' },
    { label: 'Total Vendors', value: stats.total_vendors, color: 'bg-green-500' },
    { label: 'Total Products', value: stats.total_products, color: 'bg-purple-500' },
    { label: 'Total Orders', value: stats.total_orders, color: 'bg-orange-500' },
    { label: 'Total Revenue', value: `$${parseFloat(stats.total_revenue).toFixed(2)}`, color: 'bg-emerald-500' },
    { label: 'Pending Vendors', value: stats.pending_vendors, color: 'bg-yellow-500' },
    { label: 'Pending Withdrawals', value: stats.pending_withdrawals, color: 'bg-red-500' },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="card">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${card.color}`} />
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Orders</h3>
      {stats.recent_orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-100">
                  <td className="py-3">{o.customer_name}</td>
                  <td className="py-3">${parseFloat(o.total_amount).toFixed(2)}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      o.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      o.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      o.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                      o.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>{o.status}</span>
                  </td>
                  <td className="py-3 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(stats.pending_vendors > 0 || stats.pending_withdrawals > 0) && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">Pending Actions</h4>
          <div className="space-y-1 text-sm text-yellow-700">
            {stats.pending_vendors > 0 && (
              <p>
                <Link to="/admin/vendors" className="underline">{stats.pending_vendors} vendor(s)</Link> pending approval
              </p>
            )}
            {stats.pending_withdrawals > 0 && (
              <p>
                <Link to="/admin/withdrawals" className="underline">{stats.pending_withdrawals} withdrawal(s)</Link> pending approval
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
