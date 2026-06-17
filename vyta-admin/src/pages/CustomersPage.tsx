import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/src/api/admin';
import DataTable from '@/src/components/DataTable';
import Modal from '@/src/components/Modal';
import type { Customer } from '@/src/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await adminApi.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
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
    { key: 'name', header: 'Name', sortable: true, render: (c: Customer) => c.name || `${c.first_name} ${c.last_name}`.trim() || '-' },
    { key: 'email', header: 'Email', render: (c: Customer) => c.user?.email || '-' },
    { key: 'store_role', header: 'Store Role', render: (c: Customer) => {
      if (c.store_role === 'acquire_barbell_plates_apparel_snacks') return 'Acquire barbell plates, apparel & snacks';
      if (c.store_role === 'buyer') return 'Buyer';
      return c.store_role || '-';
    }},
    { key: 'is_email_verified', header: 'Email Verified', render: (c: Customer) => (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.is_email_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
        {c.is_email_verified ? 'Yes' : 'No'}
      </span>
    )},
    { key: 'phone', header: 'Phone', render: (c: Customer) => c.phone || '-' },
    { key: 'created_at', header: 'Joined', sortable: true, render: (c: Customer) => new Date(c.created_at).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
        <span className="text-sm text-gray-500">{customers.length} customers</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <DataTable
          columns={columns}
          data={customers}
          searchKeys={['first_name', 'last_name']}
          onRowClick={handleView}
        />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Customer Details">
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Name</label>
                <p className="text-sm font-medium text-gray-900">{selectedCustomer.name || `${selectedCustomer.first_name} ${selectedCustomer.last_name}`.trim() || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <p className="text-sm font-medium text-gray-900">{selectedCustomer.user?.email || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Store Role</label>
                <p className="text-sm font-medium text-gray-900">
                  {selectedCustomer.store_role === 'acquire_barbell_plates_apparel_snacks'
                    ? 'Acquire barbell plates, apparel & snacks'
                    : selectedCustomer.store_role === 'buyer'
                    ? 'Buyer'
                    : selectedCustomer.store_role || '-'}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Phone</label>
                <p className="text-sm font-medium text-gray-900">{selectedCustomer.phone || '-'}</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Shipping Address</label>
                <p className="text-sm font-medium text-gray-900">{selectedCustomer.shipping_address || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Email Verified</label>
                <p className="text-sm font-medium text-gray-900">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${selectedCustomer.is_email_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {selectedCustomer.is_email_verified ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">MFA Enabled</label>
                <p className="text-sm font-medium text-gray-900">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${selectedCustomer.mfa_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {selectedCustomer.mfa_enabled ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Active</label>
                <p className="text-sm font-medium text-gray-900">{selectedCustomer.user?.is_active ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Customer Since</label>
                <p className="text-sm font-medium text-gray-900">{new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
