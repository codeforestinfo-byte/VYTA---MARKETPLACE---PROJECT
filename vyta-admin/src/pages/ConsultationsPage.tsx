import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/src/api/admin';
import DataTable from '@/src/components/DataTable';
import Modal from '@/src/components/Modal';
import type { Consultation } from '@/src/types';

const STATUS_OPTIONS = ['', 'scheduled', 'completed', 'cancelled'];

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Consultation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getConsultations(statusFilter || undefined);
      setConsultations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleView = (c: Consultation) => {
    setSelected(c);
    setNotes(c.notes || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    try {
      await adminApi.updateConsultation(selected.id, { notes });
      setShowModal(false);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const columns = [
    { key: 'customer_name', header: 'Customer', sortable: true, render: (c: Consultation) => c.customer_name || c.customer_id.slice(0, 8) },
    { key: 'vendor_name', header: 'Vendor/Trainer', sortable: true, render: (c: Consultation) => c.vendor_name || c.vendor_id.slice(0, 8) },
    { key: 'scheduled_at', header: 'Scheduled', sortable: true, render: (c: Consultation) => new Date(c.scheduled_at).toLocaleString() },
    { key: 'status', header: 'Status', sortable: true, render: (c: Consultation) => (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
        c.status === 'completed' ? 'bg-green-100 text-green-800' :
        c.status === 'cancelled' ? 'bg-red-100 text-red-800' :
        'bg-blue-100 text-blue-800'
      }`}>{c.status}</span>
    )},
    { key: 'meeting_link', header: 'Meeting', render: (c: Consultation) => c.meeting_link ? (
      <a href={c.meeting_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-xs" onClick={(e) => e.stopPropagation()}>Join</a>
    ) : '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Consultation Management</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <DataTable
          columns={columns}
          data={consultations}
          searchKeys={['customer_name', 'vendor_name']}
          onRowClick={handleView}
        />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Consultation Details">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Customer</label>
                <p className="text-sm font-medium text-gray-900">{selected.customer_name || selected.customer_id}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Vendor/Trainer</label>
                <p className="text-sm font-medium text-gray-900">{selected.vendor_name || selected.vendor_id}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Scheduled</label>
                <p className="text-sm font-medium text-gray-900">{new Date(selected.scheduled_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Status</label>
                <p className="text-sm font-medium text-gray-900 capitalize">{selected.status}</p>
              </div>
              {selected.meeting_link && (
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">Meeting Link</label>
                  <p className="text-sm font-medium text-indigo-600">
                    <a href={selected.meeting_link} target="_blank" rel="noopener noreferrer">{selected.meeting_link}</a>
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Add internal notes..."
              />
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                Save Notes
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
