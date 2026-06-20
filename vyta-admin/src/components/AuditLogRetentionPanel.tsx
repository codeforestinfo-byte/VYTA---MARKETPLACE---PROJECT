import { useState, useEffect } from 'react';
import { Download, Save, RefreshCw, Trash2, Clock } from 'lucide-react';
import { useToast } from './Toast';
import { getRetentionConfig, updateRetentionConfig, cleanupAuditLogs, downloadAuditLogsCsv } from '../api/adminManagement';
import type { RetentionConfigResponse } from '../api/types';

export default function AuditLogRetentionPanel() {
  const [config, setConfig] = useState<RetentionConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editRetentionDays, setEditRetentionDays] = useState(365);
  const [editAutoDelete, setEditAutoDelete] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const { addToast, toastContainer } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const cfg = await getRetentionConfig();
      setConfig(cfg);
      setEditRetentionDays(cfg.retention_days);
      setEditAutoDelete(cfg.auto_delete_enabled);
    } catch {
      addToast('error', 'Failed to load retention config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    try {
      const updated = await updateRetentionConfig({
        retention_days: editRetentionDays,
        auto_delete_enabled: editAutoDelete,
      });
      setConfig(updated);
      addToast('success', 'Retention config updated');
    } catch {
      addToast('error', 'Failed to update config');
    }
  };

  const handleCleanup = async () => {
    setCleaning(true);
    try {
      const res = await cleanupAuditLogs();
      addToast('success', res.detail);
      fetchData();
    } catch {
      addToast('error', 'Failed to cleanup');
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-4">
      {toastContainer}

      <div className="data-card">
        <div className="data-card-header">
          <h3>Audit Log Export</h3>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-600 mb-3">Download all audit logs as CSV for external analysis.</p>
          <button onClick={() => downloadAuditLogsCsv()} className="btn-primary text-xs px-3 py-1.5">
            <Download size={12} className="mr-1" />Export All Audit Logs
          </button>
        </div>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <h3>Retention Policy</h3>
        </div>
        {loading ? (
          <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
        ) : (
          <div className="p-4 space-y-4 max-w-md">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Retention Period (days)</label>
              <input type="number" value={editRetentionDays} onChange={e => setEditRetentionDays(Number(e.target.value))}
                min={1} max={3650} className="text-xs border border-gray-300 rounded px-2 py-1.5 w-full" />
              <p className="text-[10px] text-gray-400 mt-1">Audit logs older than this will be eligible for automatic cleanup</p>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={editAutoDelete} onChange={e => setEditAutoDelete(e.target.checked)} id="autoDelete" className="rounded" />
              <label htmlFor="autoDelete" className="text-xs text-gray-700">Enable automatic deletion of old audit logs</label>
            </div>
            <div className="flex space-x-2">
              <button onClick={handleSave} className="btn-primary text-xs px-3 py-1.5">
                <Save size={12} className="mr-1" />Save Configuration
              </button>
              <button onClick={handleCleanup} disabled={cleaning || !config?.auto_delete_enabled}
                className="btn-warning text-xs px-3 py-1.5 disabled:opacity-50">
                <Trash2 size={12} className="mr-1" />{cleaning ? 'Cleaning...' : 'Run Cleanup Now'}
              </button>
            </div>
            {config?.last_cleaned_at && (
              <p className="text-[10px] text-gray-400">Last cleanup: {new Date(config.last_cleaned_at).toLocaleString()}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
