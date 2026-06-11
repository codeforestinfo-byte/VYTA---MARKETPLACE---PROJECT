import { useState, useEffect } from 'react';
import { api } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/customers/orders')
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">My Orders</h2>
      {orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">
                  Order #{order.id.slice(0, 8)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="space-y-2 mb-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.product_name} x{item.quantity}</span>
                    <span className="font-medium">${parseFloat(item.price_at_purchase).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</span>
                <span className="font-bold">Total: ${parseFloat(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
