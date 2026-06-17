import { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { authApi } from '@/src/api/auth';

export default function ProfilePage() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setSaving(true);
    try {
      const payload: { email?: string; password?: string } = {};
      if (email !== user?.email) payload.email = email;
      if (password) payload.password = password;

      if (Object.keys(payload).length === 0) {
        setMessage({ type: 'error', text: 'No changes to save' });
        setSaving(false);
        return;
      }

      await authApi.updateProfile(payload);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update profile',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>

      <div className="max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Administrator</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mt-1">
                Admin
              </span>
            </div>
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg mb-4 text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
