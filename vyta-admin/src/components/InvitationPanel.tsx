import { useState, useEffect } from 'react';
import { Mail, Plus, RefreshCw, Send, Trash2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from './Toast';
import { listInvitations, createInvitation, resendInvitation, cancelInvitation } from '../api/adminManagement';
import type { AdminInvitationResponse, InvitationListResponse } from '../api/types';

const ADMIN_ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'support_agent', label: 'Support Agent' },
  { value: 'content_manager', label: 'Content Manager' },
  { value: 'finance', label: 'Finance' },
];

export default function InvitationPanel() {
  const [invitations, setInvitations] = useState<AdminInvitationResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'admin' });
  const { addToast, toastContainer } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listInvitations({ status: statusFilter || undefined, limit: 100 });
      setInvitations(res.items);
      setTotal(res.total);
    } catch (err) {
      addToast('error', 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleCreate = async () => {
    if (!form.email.trim() || !form.name.trim()) {
      addToast('warning', 'Email and name are required');
      return;
    }
    try {
      await createInvitation(form);
      addToast('success', `Invitation sent to ${form.email}`);
      setShowCreate(false);
      setForm({ email: '', name: '', role: 'admin' });
      fetchData();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to create invitation');
    }
  };

  const handleResend = async (id: string) => {
    try {
      await resendInvitation(id);
      addToast('success', 'Invitation resent');
      fetchData();
    } catch (err) {
      addToast('error', 'Failed to resend invitation');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelInvitation(id);
      addToast('success', 'Invitation cancelled');
      fetchData();
    } catch (err) {
      addToast('error', 'Failed to cancel invitation');
    }
  };

  const getStatusBadge = (inv: AdminInvitationResponse) => {
    if (inv.accepted_at) return { label: 'Accepted', class: 'bg-green-100 text-green-800' };
    if (new Date(inv.expires_at) < new Date()) return { label: 'Expired', class: 'bg-gray-100 text-gray-600' };
    return { label: 'Pending', class: 'bg-amber-100 text-amber-800' };
  };

  return (
    <div className="space-y-4">
      {toastContainer}

      <div className="data-card">
        <div className="data-card-header">
          <h3>Invitations ({total})</h3>
          <div className="flex items-center space-x-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="expired">Expired</option>
            </select>
            <button onClick={() => setShowCreate(true)} className="btn-primary text-xs px-3 py-1.5">
              <Plus size={12} className="mr-1" />Invite
            </button>
            <button onClick={fetchData} className="btn-secondary text-xs px-3 py-1.5">
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {showCreate && (
          <div className="border-b border-gray-200 p-4 bg-gray-50">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Full name" className="text-xs border border-gray-300 rounded px-2 py-1.5 w-40" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Email</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com" className="text-xs border border-gray-300 rounded px-2 py-1.5 w-52" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="text-xs border border-gray-300 rounded px-2 py-1.5 w-32">
                  {ADMIN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <button onClick={handleCreate} className="btn-primary text-xs px-3 py-1.5">
                <Send size={12} className="mr-1" />Send
              </button>
              <button onClick={() => setShowCreate(false)} className="btn-secondary text-xs px-3 py-1.5">
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
        ) : invitations.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No invitations found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Expires</th><th className="w-24">Actions</th></tr>
            </thead>
            <tbody>
              {invitations.map(inv => {
                const status = getStatusBadge(inv);
                return (
                  <tr key={inv.id}>
                    <td className="text-xs font-medium">{inv.name}</td>
                    <td className="text-xs">{inv.email}</td>
                    <td className="text-xs">{inv.role.replace('_', ' ')}</td>
                    <td><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${status.class}`}>{status.label}</span></td>
                    <td className="text-xs text-gray-500">{new Date(inv.expires_at).toLocaleDateString()}</td>
                    <td>
                      <div className="flex space-x-1">
                        {!inv.accepted_at && new Date(inv.expires_at) >= new Date() && (
                          <button onClick={() => handleResend(inv.id)} className="text-blue-500 hover:text-blue-700 p-1" title="Resend">
                            <Send size={12} />
                          </button>
                        )}
                        {!inv.accepted_at && (
                          <button onClick={() => handleCancel(inv.id)} className="text-red-500 hover:text-red-700 p-1" title="Cancel">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
