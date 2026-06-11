import { useState, useEffect } from 'react';
import { api } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function VendorLedger() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/vendors/ledger')
      .then(setTransactions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaction Ledger</h2>
      {transactions.length === 0 ? (
        <p className="text-gray-500">No transactions yet.</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((txn) => (
            <div key={txn.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">{txn.description}</p>
                <p className="text-xs text-gray-500">{new Date(txn.created_at).toLocaleString()}</p>
              </div>
              <span className={`font-bold text-lg ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                {txn.type === 'credit' ? '+' : '-'}${parseFloat(txn.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
