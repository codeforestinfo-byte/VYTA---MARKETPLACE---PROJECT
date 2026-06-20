import { useState } from 'react';
import { Upload, Download, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from './Toast';
import { bulkImportUsers } from '../api/adminManagement';
import type { BulkImportItem, BulkImportResponse } from '../api/types';

const ADMIN_ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'support_agent', label: 'Support Agent' },
  { value: 'content_manager', label: 'Content Manager' },
  { value: 'finance', label: 'Finance' },
];

export default function BulkImportPanel() {
  const [rows, setRows] = useState<BulkImportItem[]>([{ email: '', name: '', password: '', store_role: 'admin' }]);
  const [result, setResult] = useState<BulkImportResponse | null>(null);
  const [importing, setImporting] = useState(false);
  const { addToast, toastContainer } = useToast();

  const addRow = () => setRows([...rows, { email: '', name: '', password: '', store_role: 'admin' }]);
  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof BulkImportItem, value: string) => {
    const newRows = [...rows];
    (newRows[i] as any)[field] = value;
    setRows(newRows);
  };

  const handleImport = async () => {
    const valid = rows.filter(r => r.email.trim() && r.name.trim() && r.password);
    if (valid.length === 0) {
      addToast('warning', 'No valid rows to import');
      return;
    }
    setImporting(true);
    setResult(null);
    try {
      const res = await bulkImportUsers(valid);
      setResult(res);
      addToast('success', `Imported ${res.succeeded} users (${res.failed} failed)`);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const header = 'name,email,password,role';
    const sample = 'John Doe,john@example.com,password123,admin';
    const csv = `${header}\n${sample}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bulk_import_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {toastContainer}

      <div className="data-card">
        <div className="data-card-header">
          <h3>Bulk Import Users</h3>
          <button onClick={downloadTemplate} className="btn-secondary text-xs px-3 py-1.5">
            <Download size={12} className="mr-1" />Download Template
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-600">Add user rows below and click import to create multiple admin users at once.</p>

          {rows.map((row, i) => (
            <div key={i} className="flex items-end space-x-2 border-b border-gray-100 pb-2">
              <div className="flex-1">
                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Name</label>
                <input value={row.name} onChange={e => updateRow(i, 'name', e.target.value)}
                  placeholder="Full name" className="text-xs border border-gray-300 rounded px-2 py-1.5 w-full" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Email</label>
                <input value={row.email} onChange={e => updateRow(i, 'email', e.target.value)}
                  placeholder="email@example.com" className="text-xs border border-gray-300 rounded px-2 py-1.5 w-full" />
              </div>
              <div className="w-28">
                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Password</label>
                <input value={row.password} onChange={e => updateRow(i, 'password', e.target.value)}
                  placeholder="Password" type="password" className="text-xs border border-gray-300 rounded px-2 py-1.5 w-full" />
              </div>
              <div className="w-28">
                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Role</label>
                <select value={row.store_role} onChange={e => updateRow(i, 'store_role', e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1.5 w-full">
                  {ADMIN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {rows.length > 1 && (
                <button onClick={() => removeRow(i)} className="text-red-500 hover:text-red-700 p-1 mb-1">
                  <XCircle size={16} />
                </button>
              )}
            </div>
          ))}

          <div className="flex space-x-2">
            <button onClick={addRow} className="btn-secondary text-xs px-3 py-1.5">+ Add Row</button>
            <button onClick={handleImport} disabled={importing} className="btn-primary text-xs px-4 py-1.5">
              <Upload size={12} className="mr-1" />{importing ? 'Importing...' : `Import ${rows.filter(r => r.email.trim()).length} Users`}
            </button>
          </div>

          {result && (
            <div className={`p-3 rounded text-xs ${result.failed > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
              <p className="font-semibold mb-1">
                {result.failed > 0 ? <AlertTriangle size={12} className="inline mr-1 text-amber-600" /> : <CheckCircle2 size={12} className="inline mr-1 text-green-600" />}
                Import complete: {result.succeeded} succeeded, {result.failed} failed (out of {result.total})
              </p>
              {result.errors.length > 0 && (
                <ul className="list-disc list-inside text-[10px] text-red-600 mt-1">
                  {result.errors.map((e, i) => <li key={i}>{e.email}: {e.error}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
