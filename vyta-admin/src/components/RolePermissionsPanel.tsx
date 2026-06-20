import { useState, useEffect } from 'react';
import { Shield, Plus, X, Check, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from './Toast';
import {
  listRolePermissions, createRolePermission, deleteRolePermission, getPermissionsByRole,
} from '../api/adminManagement';
import type { PermissionResponse, PermissionsByRoleResponse } from '../api/types';

const ADMIN_ROLES = ['super_admin', 'admin', 'support_agent', 'content_manager', 'finance'];
const PERMISSION_MODULES = ['orders', 'vendors', 'products', 'withdrawals', 'consultations', 'customers'];
const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete'];

const MODULE_LABELS: Record<string, string> = {
  orders: 'Orders', vendors: 'Vendors', products: 'Products',
  withdrawals: 'Withdrawals', consultations: 'Consultations', customers: 'Customers',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800', admin: 'bg-blue-100 text-blue-800',
  support_agent: 'bg-green-100 text-green-800', content_manager: 'bg-orange-100 text-orange-800',
  finance: 'bg-rose-100 text-rose-800',
};

export default function RolePermissionsPanel() {
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
  const [grouped, setGrouped] = useState<PermissionsByRoleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPerm, setNewPerm] = useState({ role: 'admin', module: 'orders', action: 'view' });
  const { addToast, toastContainer } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [perms, byRole] = await Promise.all([
        listRolePermissions(),
        getPermissionsByRole(),
      ]);
      setPermissions(perms);
      setGrouped(byRole);
    } catch (err) {
      addToast('error', 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    try {
      await createRolePermission(newPerm);
      addToast('success', 'Permission added');
      fetchData();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to add permission');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRolePermission(id);
      addToast('success', 'Permission removed');
      fetchData();
    } catch (err) {
      addToast('error', 'Failed to remove permission');
    }
  };

  const hasPermission = (role: string, module: string, action: string) => {
    return permissions.some(p => p.role === role && p.module === module && p.action === action);
  };

  if (loading) {
    return <div className="data-card p-6 text-center text-gray-400 text-sm">Loading permissions...</div>;
  }

  return (
    <div className="space-y-4">
      {toastContainer}

      <div className="data-card">
        <div className="data-card-header">
          <h3>Add Permission</h3>
        </div>
        <div className="p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Role</label>
            <select value={newPerm.role} onChange={e => setNewPerm(p => ({ ...p, role: e.target.value }))}
              className="text-xs border border-gray-300 rounded px-2 py-1.5 w-32">
              {ADMIN_ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Module</label>
            <select value={newPerm.module} onChange={e => setNewPerm(p => ({ ...p, module: e.target.value }))}
              className="text-xs border border-gray-300 rounded px-2 py-1.5 w-32">
              {PERMISSION_MODULES.map(m => <option key={m} value={m}>{MODULE_LABELS[m]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Action</label>
            <select value={newPerm.action} onChange={e => setNewPerm(p => ({ ...p, action: e.target.value }))}
              className="text-xs border border-gray-300 rounded px-2 py-1.5 w-24">
              {PERMISSION_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button onClick={handleAdd} className="btn-primary text-xs px-3 py-1.5">
            <Plus size={12} className="mr-1" />Add
          </button>
          <button onClick={fetchData} className="btn-secondary text-xs px-3 py-1.5">
            <RefreshCw size={12} className="mr-1" />Refresh
          </button>
        </div>
      </div>

      <div className="data-card overflow-x-auto">
        <div className="data-card-header">
          <h3>Permissions Matrix</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-left">Role</th>
              {PERMISSION_MODULES.map(m => (
                <th key={m} colSpan={4} className="text-center text-[10px] border-r border-gray-200 last:border-r-0">
                  {MODULE_LABELS[m]}
                </th>
              ))}
            </tr>
            <tr>
              <th></th>
              {PERMISSION_MODULES.map(m => (
                PERMISSION_ACTIONS.map(a => (
                  <th key={`${m}-${a}`} className="text-[9px] uppercase text-gray-400 font-normal p-1 w-10">{a}</th>
                ))
              ))}
            </tr>
          </thead>
          <tbody>
            {ADMIN_ROLES.map(role => (
              <tr key={role}>
                <td className="font-medium text-xs">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${ROLE_COLORS[role] || ''}`}>
                    {role.replace('_', ' ')}
                  </span>
                </td>
                {PERMISSION_MODULES.map(m => (
                  PERMISSION_ACTIONS.map(a => {
                    const active = hasPermission(role, m, a);
                    return (
                      <td key={`${role}-${m}-${a}`} className="text-center p-1">
                        {active ? <Check size={14} className="text-green-600 mx-auto" /> : <X size={14} className="text-gray-300 mx-auto" />}
                      </td>
                    );
                  })
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <h3>All Permission Entries ({permissions.length})</h3>
        </div>
        <div className="max-h-60 overflow-y-auto">
          <table className="data-table">
            <thead>
              <tr><th>Role</th><th>Module</th><th>Action</th><th className="w-16">Actions</th></tr>
            </thead>
            <tbody>
              {permissions.map(p => (
                <tr key={p.id}>
                  <td className="text-xs">{p.role}</td>
                  <td className="text-xs">{p.module}</td>
                  <td className="text-xs">{p.action}</td>
                  <td>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
