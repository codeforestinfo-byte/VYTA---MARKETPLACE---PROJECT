import { useState, useEffect } from 'react';
import { api } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const statusStyles = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminConsultations() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchConsultations = () => {
    setLoading(true);
    const query = filter ? `?status_filter=${filter}` : '';
    api(`/admin/consultations${query}`)
      .then(setConsultations)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchConsultations(); }, [filter]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api(`/admin/consultations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      toast.success(`Consultation ${status}`);
      fetchConsultations();
    } catch (err) {
      toast.error(err.message || 'Failed to update');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Consultations</h2>
        <select className="input-field w-48" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {consultations.length === 0 ? (
        <p className="text-gray-500">No consultations found.</p>
      ) : (
        <div className="space-y-3">
          {consultations.map((c) => (
            <div key={c.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{c.customer_name}</p>
                  <p className="text-sm text-gray-500">with {c.vendor_business_name}</p>
                  <p className="text-xs text-gray-400">{new Date(c.scheduled_at).toLocaleString()}</p>
                  {c.meeting_link && (
                    <a href={c.meeting_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">
                      Meeting Link
                    </a>
                  )}
                  {c.notes && <p className="text-xs text-gray-500 mt-1">Notes: {c.notes}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[c.status] || 'bg-gray-100 text-gray-800'}`}>
                    {c.status}
                  </span>
                  {c.status === 'scheduled' && (
                    <>
                      <button onClick={() => handleUpdateStatus(c.id, 'completed')} className="btn-primary text-xs px-3 py-1">
                        Complete
                      </button>
                      <button onClick={() => handleUpdateStatus(c.id, 'cancelled')} className="btn-danger text-xs px-3 py-1">
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
