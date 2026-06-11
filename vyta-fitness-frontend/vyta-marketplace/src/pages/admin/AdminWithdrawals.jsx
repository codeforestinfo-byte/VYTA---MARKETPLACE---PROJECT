import { useState, useEffect } from 'react';
import { api } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchWithdrawals = () => {
    setLoading(true);
    const query = filter ? `?status_filter=${filter}` : '';
    api(`/admin/withdrawals${query}`)
      .then(setWithdrawals)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWithdrawals(); }, [filter]);

  const handleApprove = async (id) => {
    try {
      await api(`/admin/withdrawals/${id}/approve`, { method: 'POST' });
      toast.success('Withdrawal approved');
      fetchWithdrawals();
    } catch (err) {
      toast.error(err.message || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await api(`/admin/withdrawals/${id}/reject`, { method: 'POST' });
      toast.success('Withdrawal rejected');
      fetchWithdrawals();
    } catch (err) {
      toast.error(err.message || 'Failed to reject');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Withdrawal Requests</h2>
        <select className="input-field w-48" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {withdrawals.length === 0 ? (
        <p className="text-gray-500">No withdrawal requests.</p>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((w) => (
            <div key={w.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">${parseFloat(w.amount).toFixed(2)}</p>
                  <p className="text-sm text-gray-500">Vendor: {w.vendor_id}</p>
                  <p className="text-xs text-gray-400">{new Date(w.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                    w.status === 'approved' ? 'bg-green-100 text-green-800' :
                    w.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {w.status}
                  </span>
                  {w.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(w.id)} className="btn-primary text-xs px-3 py-1">Approve</button>
                      <button onClick={() => handleReject(w.id)} className="btn-danger text-xs px-3 py-1">Reject</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
