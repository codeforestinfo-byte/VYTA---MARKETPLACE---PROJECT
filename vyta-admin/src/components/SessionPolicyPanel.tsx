import { useState, useEffect } from 'react';
import { Save, RefreshCw, LogOut } from 'lucide-react';
import { useToast } from './Toast';
import { getSessionPolicy, updateSessionPolicy } from '../api/adminManagement';
import type { SessionPolicyResponse } from '../api/types';

export default function SessionPolicyPanel() {
  const [policy, setPolicy] = useState<SessionPolicyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [idleTimeout, setIdleTimeout] = useState(30);
  const [maxSessions, setMaxSessions] = useState(5);
  const [enforceAll, setEnforceAll] = useState(true);
  const { addToast, toastContainer } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const p = await getSessionPolicy();
      setPolicy(p);
      setIdleTimeout(p.idle_timeout_minutes);
      setMaxSessions(p.max_concurrent_sessions);
      setEnforceAll(p.enforce_for_all);
    } catch {
      addToast('error', 'Failed to load session policy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    try {
      const updated = await updateSessionPolicy({
        idle_timeout_minutes: idleTimeout,
        max_concurrent_sessions: maxSessions,
        enforce_for_all: enforceAll,
      });
      setPolicy(updated);
      addToast('success', 'Session policy updated');
    } catch {
      addToast('error', 'Failed to update session policy');
    }
  };

  return (
    <div className="space-y-4">
      {toastContainer}

      <div className="data-card">
        <div className="data-card-header">
          <h3>Session Policy Configuration</h3>
          <button onClick={fetchData} className="btn-secondary text-xs px-2 py-1"><RefreshCw size={12} /></button>
        </div>
        {loading ? (
          <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
        ) : (
          <div className="p-4 space-y-4 max-w-md">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Idle Timeout (minutes)</label>
              <input type="number" value={idleTimeout} onChange={e => setIdleTimeout(Number(e.target.value))}
                min={1} max={1440} className="text-xs border border-gray-300 rounded px-2 py-1.5 w-full" />
              <p className="text-[10px] text-gray-400 mt-1">Sessions idle longer than this will be automatically terminated</p>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Max Concurrent Sessions</label>
              <input type="number" value={maxSessions} onChange={e => setMaxSessions(Number(e.target.value))}
                min={1} max={100} className="text-xs border border-gray-300 rounded px-2 py-1.5 w-full" />
              <p className="text-[10px] text-gray-400 mt-1">Maximum number of simultaneous sessions per admin user</p>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={enforceAll} onChange={e => setEnforceAll(e.target.checked)} id="enforceAll" className="rounded" />
              <label htmlFor="enforceAll" className="text-xs text-gray-700">Enforce policy for all admin users</label>
            </div>
            <button onClick={handleSave} className="btn-primary text-xs px-4 py-1.5">
              <Save size={12} className="mr-1" />Save Policy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
