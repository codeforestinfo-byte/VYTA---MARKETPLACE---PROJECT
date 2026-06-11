import { useState, useEffect } from 'react';
import { api } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function VendorDocuments() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ document_type: 'id_proof', document_url: '' });

  const fetchDocs = () => {
    setLoading(true);
    api('/vendors/documents')
      .then(setDocs)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api('/vendors/documents', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      toast.success('Document uploaded');
      setShowForm(false);
      setForm({ document_type: 'id_proof', document_url: '' });
      fetchDocs();
    } catch (err) {
      toast.error(err.message || 'Failed to upload');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">My Documents</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? 'Cancel' : 'Upload Document'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select className="input-field" value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })}>
              <option value="id_proof">ID Proof</option>
              <option value="business_license">Business License</option>
              <option value="certification">Certification</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document URL</label>
            <input type="url" className="input-field" value={form.document_url} onChange={(e) => setForm({ ...form, document_url: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary">Upload</button>
        </form>
      )}

      {docs.length === 0 ? (
        <p className="text-gray-500">No documents uploaded.</p>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div key={doc.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 capitalize">{doc.document_type.replace('_', ' ')}</p>
                <p className="text-sm text-gray-500">{doc.document_url}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
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
  );
}
