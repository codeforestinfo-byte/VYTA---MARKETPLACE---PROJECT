import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/src/api/admin';
import DataTable from '@/src/components/DataTable';
import Modal from '@/src/components/Modal';
import type { Order } from '@/src/types';

const STATUS_OPTIONS = ['', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getOrders(statusFilter || undefined);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleView = async (order: Order) => {
    try {
      const detail = await adminApi.getOrder(order.id);
      setSelectedOrder(detail);
    } catch {
      setSelectedOrder(order);
    }
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const columns = [
    { key: 'id', header: 'Order ID', render: (o: Order) => (
      <span className="font-mono text-xs">{o.id.slice(0, 8)}...</span>
    )},
    { key: 'customer_email', header: 'Customer', render: (o: Order) => o.customer_email || o.customer_id.slice(0, 8) || '-' },
    { key: 'total_amount', header: 'Amount', sortable: true, render: (o: Order) => `$${Number(o.total_amount).toLocaleString()}` },
    { key: 'status', header: 'Status', sortable: true, render: (o: Order) => (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
        o.status === 'delivered' ? 'bg-green-100 text-green-800' :
        o.status === 'paid' ? 'bg-blue-100 text-blue-800' :
        o.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
        o.status === 'cancelled' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>{o.status}</span>
    )},
    { key: 'created_at', header: 'Date', sortable: true, render: (o: Order) => new Date(o.created_at).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <DataTable
          columns={columns}
          data={orders}
          searchKeys={['id', 'customer_email']}
          onRowClick={handleView}
        />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Order Details" maxWidth="max-w-3xl">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Order ID</label>
                <p className="text-sm font-mono text-gray-900">{selectedOrder.id}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Status</label>
                <p className="text-sm font-medium text-gray-900 capitalize">{selectedOrder.status}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Total Amount</label>
                <p className="text-sm font-medium text-gray-900">${Number(selectedOrder.total_amount).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Date</label>
                <p className="text-sm font-medium text-gray-900">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
            </div>

            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Items</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Product</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Qty</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Price</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-2 px-3">{item.product_name || item.product_id.slice(0, 8)}</td>
                        <td className="py-2 px-3">{item.quantity}</td>
                        <td className="py-2 px-3">${Number(item.price_at_purchase).toFixed(2)}</td>
                        <td className="py-2 px-3">${(item.quantity * Number(item.price_at_purchase)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
