import { useState, useEffect } from 'react';
import { api } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function VendorWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', bank_details: '{}' });
  const [balance, setBalance] = useState(0);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api('/vendors/withdrawals'),
      api('/vendors/me'),
    ])
      .then(([w, v]) => {
        setWithdrawals(w);
        setBalance(parseFloat(v.current_balance));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let bankDetails;
    try {
      bankDetails = JSON.parse(form.bank_details);
    } catch {
      toast.error('Bank details must be valid JSON');
      return;
    }
    try {
      await api('/vendors/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          bank_details: bankDetails,
        }),
      });
      toast.success('Withdrawal requested');
      setShowForm(false);
      setForm({ amount: '', bank_details: '{}' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to request withdrawal');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Withdrawals</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? 'Cancel' : 'Request Withdrawal'}
        </button>
      </div>

      <div className="card mb-6">
        <p className="text-sm text-gray-500">Available Balance</p>
        <p className="text-2xl font-bold text-green-600">${balance.toFixed(2)}</p>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
            <input type="number" step="0.01" min="0.01" max={balance} className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Details (JSON)</label>
            <textarea className="input-field" rows={4} value={form.bank_details} onChange={(e) => setForm({ ...form, bank_details: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary">Submit Request</button>
        </form>
      )}

      {withdrawals.length === 0 ? (
        <p className="text-gray-500">No withdrawal requests.</p>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((w) => (
            <div key={w.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium">${parseFloat(w.amount).toFixed(2)}</p>
                <p className="text-xs text-gray-500">{new Date(w.created_at).toLocaleString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                w.status === 'approved' ? 'bg-green-100 text-green-800' :
                w.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {w.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
