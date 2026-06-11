import { useState, useEffect } from 'react';
import { api } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function CustomerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', shipping_address: '' });

  useEffect(() => {
    api('/customers/me')
      .then((data) => {
        setProfile(data);
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          shipping_address: data.shipping_address || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api('/customers/me', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setProfile(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">My Profile</h2>
      <form onSubmit={handleSave} className="card max-w-lg space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input type="text" className="input-field" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input type="text" className="input-field" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input type="text" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
          <textarea className="input-field" rows={3} value={form.shipping_address} onChange={(e) => setForm({ ...form, shipping_address: e.target.value })} />
        </div>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
      </form>
    </div>
  );
}
