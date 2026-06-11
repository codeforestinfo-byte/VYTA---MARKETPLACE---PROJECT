import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { api } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

const navItems = [
  { path: '/dashboard', label: 'Overview', end: true },
  { path: '/dashboard/orders', label: 'My Orders' },
  { path: '/dashboard/consultations', label: 'Consultations' },
  { path: '/dashboard/profile', label: 'Profile' },
];

export default function CustomerDashboard() {
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/customers/me')
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (location.pathname === '/dashboard' && !location.pathname.includes('/orders') && !location.pathname.includes('/consultations') && !location.pathname.includes('/profile')) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Customer Dashboard</h1>
        {loading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500">Welcome</h3>
              <p className="text-lg font-semibold mt-1">
                {profile ? `${profile.first_name} ${profile.last_name}` : 'Customer'}
              </p>
            </div>
            <Link to="/dashboard/orders" className="card hover:shadow-md transition-shadow">
              <h3 className="text-sm font-medium text-gray-500">My Orders</h3>
              <p className="text-2xl font-bold text-primary-600 mt-1">View</p>
            </Link>
            <Link to="/dashboard/consultations" className="card hover:shadow-md transition-shadow">
              <h3 className="text-sm font-medium text-gray-500">Consultations</h3>
              <p className="text-2xl font-bold text-primary-600 mt-1">Book</p>
            </Link>
          </div>
        )}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6">
            {navItems.map((item) => {
              const isActive = item.end ? location.pathname === item.path : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`pb-3 text-sm font-medium border-b-2 ${
                    isActive ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Customer Dashboard</h1>
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {navItems.map((item) => {
            const isActive = item.end ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`pb-3 text-sm font-medium border-b-2 ${
                  isActive ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
