import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, ToggleLeft, ToggleRight, Globe } from 'lucide-react';
import { useToast } from './Toast';
import { listIPAllowlist, addIPAllowlistEntry, removeIPAllowlistEntry, toggleIPAllowlistEntry } from '../api/adminManagement';
import type { IPAllowlistEntryResponse } from '../api/types';

export default function IPAllowlistPanel() {
  const [entries, setEntries] = useState<IPAllowlistEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ip_address: '', description: '' });
  const { addToast, toastContainer } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await listIPAllowlist();
      setEntries(data);
    } catch {
      addToast('error', 'Failed to load IP allowlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!form.ip_address.trim()) {
      addToast('warning', 'IP address is required');
      return;
    }
    try {
      await addIPAllowlistEntry({ ip_address: form.ip_address.trim(), description: form.description.trim() || undefined });
      addToast('success', 'IP added to allowlist');
      setShowAdd(false);
      setForm({ ip_address: '', description: '' });
      fetchData();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to add IP');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeIPAllowlistEntry(id);
      addToast('success', 'IP removed from allowlist');
      fetchData();
    } catch {
      addToast('error', 'Failed to remove IP');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleIPAllowlistEntry(id);
      fetchData();
    } catch {
      addToast('error', 'Failed to toggle entry');
    }
  };

  return (
    <div className="space-y-4">
      {toastContainer}

      <div className="data-card">
        <div className="data-card-header">
          <h3>IP Allowlist ({entries.length})</h3>
          <div className="flex items-center space-x-2">
            <button onClick={() => setShowAdd(true)} className="btn-primary text-xs px-3 py-1.5">
              <Plus size={12} className="mr-1" />Add IP
            </button>
            <button onClick={fetchData} className="btn-secondary text-xs px-2 py-1"><RefreshCw size={12} /></button>
          </div>
        </div>

        {showAdd && (
          <div className="border-b border-gray-200 p-4 bg-gray-50">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">IP Address / CIDR</label>
                <input value={form.ip_address} onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))}
                  placeholder="e.g. 192.168.1.0/24" className="text-xs border border-gray-300 rounded px-2 py-1.5 w-48" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Office VPN" className="text-xs border border-gray-300 rounded px-2 py-1.5 w-48" />
              </div>
              <button onClick={handleAdd} className="btn-primary text-xs px-3 py-1.5">Add</button>
              <button onClick={() => setShowAdd(false)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No IP allowlist entries configured</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>IP Address</th><th>Description</th><th>Status</th><th>Created</th><th className="w-20">Actions</th></tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td className="text-xs font-mono font-medium">{e.ip_address}</td>
                  <td className="text-xs text-gray-600">{e.description || '-'}</td>
                  <td>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${e.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {e.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-xs text-gray-500">{new Date(e.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex space-x-1">
                      <button onClick={() => handleToggle(e.id)} className="text-blue-500 hover:text-blue-700 p-1" title={e.is_active ? 'Deactivate' : 'Activate'}>
                        {e.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                      <button onClick={() => handleRemove(e.id)} className="text-red-500 hover:text-red-700 p-1" title="Remove">
                        <Trash2 size={12} />
                      </button>
                    </div>
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
