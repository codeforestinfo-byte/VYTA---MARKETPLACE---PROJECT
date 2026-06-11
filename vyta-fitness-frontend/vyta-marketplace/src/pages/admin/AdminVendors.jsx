import { useState, useEffect } from 'react';
import { api } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorDocs, setVendorDocs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', business_name: '', description: '',
  });

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fetchVendors = () => {
    setLoading(true);
    api('/admin/vendors')
      .then(setVendors)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVendors(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api('/admin/vendors', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      toast.success('Vendor created');
      setShowForm(false);
      setForm({ email: '', password: '', business_name: '', description: '' });
      fetchVendors();
    } catch (err) {
      toast.error(err.message || 'Failed to create vendor');
    }
  };

  const handleViewDocs = async (vendorId) => {
    try {
      const docs = await api(`/admin/vendors/${vendorId}/documents`);
      setVendorDocs(docs);
      setSelectedVendor(vendorId);
    } catch {
      toast.error('Failed to load documents');
    }
  };

  const handleVerify = async (vendorId) => {
    try {
      await api(`/admin/vendors/${vendorId}/verify`, { method: 'POST' });
      toast.success('Vendor approved');
      fetchVendors();
      setSelectedVendor(null);
    } catch (err) {
      toast.error(err.message || 'Failed to verify');
    }
  };

  const handleReject = async (vendorId) => {
    try {
      await api(`/admin/vendors/${vendorId}/reject`, { method: 'POST' });
      toast.success('Vendor rejected');
      fetchVendors();
      setSelectedVendor(null);
    } catch (err) {
      toast.error(err.message || 'Failed to reject');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Vendor Management</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? 'Cancel' : '+ Add Vendor'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-4">
          <h3 className="font-semibold text-gray-900">New Vendor</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" className="input-field" value={form.email} onChange={handleFormChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" name="password" className="input-field" value={form.password} onChange={handleFormChange} required minLength={6} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input type="text" name="business_name" className="input-field" value={form.business_name} onChange={handleFormChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <textarea name="description" rows={2} className="input-field" value={form.description} onChange={handleFormChange} />
            </div>
          </div>
          <button type="submit" className="btn-primary">Create Vendor</button>
        </form>
      )}

      <div className="space-y-4">
        {vendors.map((v) => (
          <div key={v.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{v.business_name}</h3>
                <p className="text-sm text-gray-500">Vendor ID: {v.id}</p>
                <p className="text-sm text-gray-500">Balance: ${parseFloat(v.current_balance || 0).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  v.onboarding_status === 'approved' ? 'bg-green-100 text-green-800' :
                  v.onboarding_status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {v.onboarding_status}
                </span>
                {v.onboarding_status === 'pending' && (
                  <>
                    <button onClick={() => handleVerify(v.id)} className="btn-primary text-xs px-3 py-1">Approve</button>
                    <button onClick={() => handleReject(v.id)} className="btn-danger text-xs px-3 py-1">Reject</button>
                  </>
                )}
                <button onClick={() => handleViewDocs(v.id)} className="text-primary-600 text-sm font-medium">
                  {selectedVendor === v.id ? 'Hide Docs' : 'View Docs'}
                </button>
              </div>
            </div>
            {selectedVendor === v.id && vendorDocs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                {vendorDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{doc.document_type.replace('_', ' ')}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                      doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                      doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {vendors.length === 0 && <p className="text-gray-500">No vendors registered.</p>}
      </div>
    </div>
  );
}
