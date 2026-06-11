import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      if (data.role !== 'admin') {
        toast.error('Access denied. Admin credentials required.');
        return;
      }
      toast.success('Admin logged in');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 mt-2">Sign in to manage the marketplace</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-8 space-y-5 border border-gray-800">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Admin Email</label>
            <input
              type="email"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In to Admin'}
          </button>
          <p className="text-center text-sm text-gray-500">
            <a href="/login" className="text-primary-400 hover:text-primary-300">Back to main login</a>
          </p>
        </form>
      </div>
    </div>
  );
}
