import { useState, useEffect } from 'react';
import { api } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function CustomerConsultations() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vendor_id: '', scheduled_at: '' });
  const [vendors, setVendors] = useState([]);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api('/consultations'),
      api('/vendors/me').catch(() => []),
    ])
      .then(([cons, vends]) => {
        setConsultations(cons);
        if (Array.isArray(vends)) setVendors(vends);
        else setVendors([]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      await api('/consultations', {
        method: 'POST',
        body: JSON.stringify({
          vendor_id: form.vendor_id,
          scheduled_at: new Date(form.scheduled_at).toISOString(),
        }),
      });
      toast.success('Consultation booked');
      setShowForm(false);
      setForm({ vendor_id: '', scheduled_at: '' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to book');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">My Consultations</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? 'Cancel' : 'Book Consultation'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleBook} className="card mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor ID</label>
            <input
              type="text"
              className="input-field"
              value={form.vendor_id}
              onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}
              required
              placeholder="Enter vendor UUID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date & Time</label>
            <input
              type="datetime-local"
              className="input-field"
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn-primary">Book</button>
        </form>
      )}

      {consultations.length === 0 ? (
        <p className="text-gray-500">No consultations booked.</p>
      ) : (
        <div className="space-y-4">
          {consultations.map((c) => (
            <div key={c.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Vendor: {c.vendor_id}</p>
                  <p className="font-medium mt-1">{new Date(c.scheduled_at).toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  c.status === 'completed' ? 'bg-green-100 text-green-800' :
                  c.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {c.status}
                </span>
              </div>
              {c.meeting_link && (
                <a href={c.meeting_link} target="_blank" className="text-primary-600 text-sm mt-2 inline-block" rel="noreferrer">
                  Join Meeting &rarr;
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
