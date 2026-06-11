import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';

export default function AdminProfile() {
  const [profile, setProfile] = useState({ email: '' });
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api('/admin/me').then(setProfile).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { email: profile.email };
      if (password) payload.password = password;
      const updated = await api('/admin/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setProfile(updated);
      setPassword('');
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Admin Profile</h2>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className="input-field"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
