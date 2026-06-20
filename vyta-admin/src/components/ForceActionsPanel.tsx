import { useState, useEffect } from 'react';
import { Shield, Lock, Mail, RefreshCw } from 'lucide-react';
import { useToast } from './Toast';
import { listForceActions, forcePasswordReset, forceMfaEnrollment, forceEmailVerification } from '../api/adminManagement';
import { listAdminUsers } from '../api/adminUsers';
import type { ForceActionResponse, AdminUserResponse } from '../api/types';

export default function ForceActionsPanel() {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [actions, setActions] = useState<ForceActionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast, toastContainer } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await listAdminUsers({ limit: 200 });
      setUsers(res.items);
    } catch (err) {
      addToast('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const fetchActions = async (userId: string) => {
    try {
      const data = await listForceActions(userId);
      setActions(data);
    } catch { setActions([]); }
  };

  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
    if (userId) fetchActions(userId);
    else setActions([]);
  };

  const handleForce = async (type: 'password_reset' | 'mfa_enrollment' | 'email_verification') => {
    if (!selectedUser) return;
    try {
      const labels = { password_reset: 'Password reset', mfa_enrollment: 'MFA enrollment', email_verification: 'Email verification' };
      if (type === 'password_reset') await forcePasswordReset(selectedUser);
      else if (type === 'mfa_enrollment') await forceMfaEnrollment(selectedUser);
      else await forceEmailVerification(selectedUser);
      addToast('success', `${labels[type]} forced successfully`);
      fetchActions(selectedUser);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to force action');
    }
  };

  return (
    <div className="space-y-4">
      {toastContainer}

      <div className="data-card">
        <div className="data-card-header">
          <h3>Force Actions</h3>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Select Admin User</label>
            <select value={selectedUser} onChange={e => handleUserChange(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1.5 w-64">
              <option value="">-- Select a user --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>

          {selectedUser && (
            <div className="flex flex-wrap gap-3">
              <button onClick={() => handleForce('password_reset')} className="btn-warning text-xs px-3 py-1.5 flex items-center space-x-1">
                <Lock size={12} /><span>Force Password Reset</span>
              </button>
              <button onClick={() => handleForce('mfa_enrollment')} className="btn-warning text-xs px-3 py-1.5 flex items-center space-x-1">
                <Shield size={12} /><span>Force MFA Enrollment</span>
              </button>
              <button onClick={() => handleForce('email_verification')} className="btn-warning text-xs px-3 py-1.5 flex items-center space-x-1">
                <Mail size={12} /><span>Force Email Verification</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedUser && (
        <div className="data-card">
          <div className="data-card-header">
            <h3>Force Action History</h3>
          </div>
          <table className="data-table">
            <thead><tr><th>Action Type</th><th>Status</th><th>Forced By</th><th>Date</th><th>Completed</th></tr></thead>
            <tbody>
              {actions.map(a => (
                <tr key={a.id}>
                  <td className="text-xs font-medium capitalize">{a.action_type.replace('_', ' ')}</td>
                  <td><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${a.is_completed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{a.is_completed ? 'Completed' : 'Pending'}</span></td>
                  <td className="text-xs">{a.forced_by.substring(0, 8)}...</td>
                  <td className="text-xs text-gray-500">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="text-xs text-gray-500">{a.completed_at ? new Date(a.completed_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
              {actions.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 text-xs py-4">No force actions yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
