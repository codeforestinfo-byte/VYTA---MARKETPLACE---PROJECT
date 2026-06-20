import { useState, useEffect } from 'react';
import { Lock, Unlock, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from './Toast';
import { listAccountLockouts, unlockAccount } from '../api/adminManagement';
import type { AccountLockoutResponse } from '../api/types';

export default function AccountLockoutPanel() {
  const [lockouts, setLockouts] = useState<AccountLockoutResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [lockedOnly, setLockedOnly] = useState(false);
  const { addToast, toastContainer } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await listAccountLockouts({ locked_only: lockedOnly, limit: 100 });
      setLockouts(data);
    } catch {
      addToast('error', 'Failed to load lockouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [lockedOnly]);

  const handleUnlock = async (adminId: string) => {
    try {
      await unlockAccount(adminId);
      addToast('success', 'Account unlocked');
      fetchData();
    } catch {
      addToast('error', 'Failed to unlock');
    }
  };

  return (
    <div className="space-y-4">
      {toastContainer}

      <div className="data-card">
        <div className="data-card-header">
          <h3>Account Lockouts ({lockouts.length})</h3>
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-1 text-xs text-gray-600">
              <input type="checkbox" checked={lockedOnly} onChange={e => setLockedOnly(e.target.checked)} className="rounded" />
              <span>Locked only</span>
            </label>
            <button onClick={fetchData} className="btn-secondary text-xs px-2 py-1"><RefreshCw size={12} /></button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
        ) : lockouts.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No lockout records found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Admin</th><th>Email</th><th>Failed Attempts</th><th>Status</th><th>Locked Until</th><th className="w-20">Action</th></tr>
            </thead>
            <tbody>
              {lockouts.map(l => (
                <tr key={l.id}>
                  <td className="text-xs font-medium">{l.admin_name}</td>
                  <td className="text-xs">{l.admin_email}</td>
                  <td className="text-xs">
                    <span className={`font-semibold ${l.failed_attempts >= 5 ? 'text-red-600' : 'text-amber-600'}`}>{l.failed_attempts}</span>
                  </td>
                  <td>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${l.is_locked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {l.is_locked ? 'Locked' : 'Active'}
                    </span>
                  </td>
                  <td className="text-xs text-gray-500">{l.locked_until ? new Date(l.locked_until).toLocaleString() : '-'}</td>
                  <td>
                    {l.is_locked && (
                      <button onClick={() => handleUnlock(l.admin_id)} className="btn-primary text-[10px] px-2 py-1 flex items-center space-x-1">
                        <Unlock size={10} /><span>Unlock</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
