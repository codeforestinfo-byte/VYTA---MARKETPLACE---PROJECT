import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from './Toast';
import { listApprovals, approveApproval, rejectApproval } from '../api/adminManagement';
import type { AdminApprovalResponse } from '../api/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function ApprovalPanel() {
  const [approvals, setApprovals] = useState<AdminApprovalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [notes, setNotes] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const { addToast, toastContainer } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await listApprovals({ status: statusFilter || undefined, limit: 100 });
      setApprovals(data);
    } catch {
      addToast('error', 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleApprove = async (id: string) => {
    try {
      await approveApproval(id, notes || undefined);
      addToast('success', 'Request approved');
      setActiveId(null);
      setNotes('');
      fetchData();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectApproval(id, notes || undefined);
      addToast('success', 'Request rejected');
      setActiveId(null);
      setNotes('');
      fetchData();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to reject');
    }
  };

  return (
    <div className="space-y-4">
      {toastContainer}

      <div className="data-card">
        <div className="data-card-header">
          <h3>Approval Requests ({approvals.length})</h3>
          <div className="flex items-center space-x-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button onClick={fetchData} className="btn-secondary text-xs px-2 py-1"><RefreshCw size={12} /></button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
        ) : approvals.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No approval requests found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Admin</th><th>Email</th><th>Requested Role</th><th>Status</th><th>Date</th><th className="w-36">Action</th></tr>
            </thead>
            <tbody>
              {approvals.map(a => (
                <tr key={a.id}>
                  <td className="text-xs font-medium">{a.admin_name}</td>
                  <td className="text-xs">{a.admin_email}</td>
                  <td className="text-xs capitalize">{a.requested_role.replace('_', ' ')}</td>
                  <td><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${STATUS_COLORS[a.status] || ''}`}>{a.status}</span></td>
                  <td className="text-xs text-gray-500">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td>
                    {a.status === 'pending' && (
                      <div className="flex flex-col space-y-1">
                        {activeId === a.id && (
                          <input value={notes} onChange={e => setNotes(e.target.value)}
                            placeholder="Notes (optional)" className="text-[10px] border border-gray-300 rounded px-1.5 py-1 w-full mb-1" />
                        )}
                        <div className="flex space-x-1">
                          <button onClick={() => activeId === a.id ? handleApprove(a.id) : setActiveId(a.id)}
                            className="text-green-600 hover:text-green-800 text-[10px] font-semibold border border-green-300 rounded px-2 py-0.5">
                            <CheckCircle2 size={10} className="inline mr-0.5" />Approve
                          </button>
                          <button onClick={() => activeId === a.id ? handleReject(a.id) : setActiveId(a.id)}
                            className="text-red-600 hover:text-red-800 text-[10px] font-semibold border border-red-300 rounded px-2 py-0.5">
                            <XCircle size={10} className="inline mr-0.5" />Reject
                          </button>
                        </div>
                      </div>
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
