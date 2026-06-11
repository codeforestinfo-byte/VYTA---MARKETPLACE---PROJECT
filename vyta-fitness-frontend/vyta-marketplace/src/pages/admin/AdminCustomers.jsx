import { useState, useEffect } from 'react';
import { api } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);

  const fetchCustomers = () => {
    setLoading(true);
    api('/admin/customers')
      .then(setCustomers)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleViewCustomer = async (id) => {
    try {
      const detail = await api(`/admin/customers/${id}`);
      setCustomerDetail(detail);
      setSelectedCustomer(id);
    } catch {
      setSelectedCustomer(null);
    }
  };

  const filtered = customers.filter((c) =>
    !search || c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.first_name.toLowerCase().includes(search.toLowerCase()) ||
    c.last_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Customers</h2>
        <input
          type="text"
          placeholder="Search customers..."
          className="input-field w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">No customers found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{c.first_name} {c.last_name}</p>
                  <p className="text-sm text-gray-500">{c.email}</p>
                  <p className="text-xs text-gray-400">{c.phone || 'No phone'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleViewCustomer(c.id)}
                    className="text-primary-600 text-sm font-medium"
                  >
                    {selectedCustomer === c.id ? 'Hide' : 'Orders'}
                  </button>
                </div>
              </div>
              {selectedCustomer === c.id && customerDetail && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-2">Order History ({customerDetail.orders.length})</p>
                  {customerDetail.orders.length === 0 ? (
                    <p className="text-sm text-gray-500">No orders yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {customerDetail.orders.map((o) => (
                        <div key={o.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">${parseFloat(o.total_amount).toFixed(2)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            o.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            o.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>{o.status}</span>
                          <span className="text-gray-400">{new Date(o.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
