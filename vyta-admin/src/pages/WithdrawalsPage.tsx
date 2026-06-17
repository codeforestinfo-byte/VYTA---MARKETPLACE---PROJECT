import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/src/api/admin';
import DataTable from '@/src/components/DataTable';
import Modal from '@/src/components/Modal';
import type { WithdrawalRequest } from '@/src/types';
import { CheckCircle, XCircle } from 'lucide-react';

const STATUS_OPTIONS = ['', 'pending', 'approved', 'rejected'];

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<WithdrawalRequest | null>(null);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getWithdrawals(statusFilter || undefined);
      setWithdrawals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await adminApi.approveWithdrawal(id);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await adminApi.rejectWithdrawal(id);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const columns = [
    { key: 'vendor_business_name', header: 'Vendor', sortable: true, render: (w: WithdrawalRequest) => w.vendor_business_name || w.vendor_id.slice(0, 8) },
    { key: 'amount', header: 'Amount', sortable: true, render: (w: WithdrawalRequest) => `$${Number(w.amount).toLocaleString()}` },
    { key: 'status', header: 'Status', sortable: true, render: (w: WithdrawalRequest) => (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
        w.status === 'approved' ? 'bg-green-100 text-green-800' :
        w.status === 'rejected' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>{w.status}</span>
    )},
    { key: 'created_at', header: 'Requested', sortable: true, render: (w: WithdrawalRequest) => new Date(w.created_at).toLocaleDateString() },
    { key: 'actions', header: 'Actions', render: (w: WithdrawalRequest) => (
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        {w.status === 'pending' && (
          <>
            <button
              onClick={() => handleApprove(w.id)}
              disabled={actionLoading === w.id}
              className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 disabled:opacity-40"
              title="Approve"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleReject(w.id)}
              disabled={actionLoading === w.id}
              className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 disabled:opacity-40"
              title="Reject"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Withdrawal Management</h1>
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
          data={withdrawals}
          searchKeys={['vendor_business_name']}
          onRowClick={(w) => { setSelected(w); setShowModal(true); }}
        />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Withdrawal Details">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Vendor</label>
                <p className="text-sm font-medium text-gray-900">{selected.vendor_business_name || selected.vendor_id}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Amount</label>
                <p className="text-sm font-medium text-gray-900">${Number(selected.amount).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Status</label>
                <p className="text-sm font-medium text-gray-900 capitalize">{selected.status}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Requested</label>
                <p className="text-sm font-medium text-gray-900">{new Date(selected.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Bank Details</label>
              <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs text-gray-700 overflow-auto">
                {JSON.stringify(selected.bank_details, null, 2)}
              </pre>
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {selected.status === 'pending' && (
                <>
                  <button
                    onClick={() => { handleApprove(selected.id); setShowModal(false); }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => { handleReject(selected.id); setShowModal(false); }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
