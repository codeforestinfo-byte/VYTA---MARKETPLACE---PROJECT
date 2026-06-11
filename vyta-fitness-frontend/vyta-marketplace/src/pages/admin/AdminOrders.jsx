import { useState, useEffect } from 'react';
import { api } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    const query = filter ? `?status_filter=${filter}` : '';
    api(`/admin/orders${query}`)
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [filter]);

  const handleViewOrder = async (id) => {
    try {
      const detail = await api(`/admin/orders/${id}`);
      setOrderDetail(detail);
      setSelectedOrder(id);
    } catch {
      setSelectedOrder(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
        <select className="input-field w-48" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500">No orders found.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{o.customer_name}</p>
                  <p className="text-sm text-gray-500">${parseFloat(o.total_amount).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[o.status] || 'bg-gray-100 text-gray-800'}`}>
                    {o.status}
                  </span>
                  <button
                    onClick={() => handleViewOrder(o.id)}
                    className="text-primary-600 text-sm font-medium"
                  >
                    {selectedOrder === o.id ? 'Hide' : 'View'}
                  </button>
                </div>
              </div>
              {selectedOrder === o.id && orderDetail && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-2">Customer: {orderDetail.customer_email}</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-500">
                        <th className="pb-2 font-medium">Product</th>
                        <th className="pb-2 font-medium">Qty</th>
                        <th className="pb-2 font-medium">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetail.items.map((item, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-2">{item.product_name}</td>
                          <td className="py-2">{item.quantity}</td>
                          <td className="py-2">${parseFloat(item.price_at_purchase).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
