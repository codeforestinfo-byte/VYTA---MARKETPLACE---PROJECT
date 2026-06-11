import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { api } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';

const navItems = [
  { path: '/vendor/dashboard', label: 'Overview', end: true },
  { path: '/vendor/products', label: 'Products' },
  { path: '/vendor/documents', label: 'Documents' },
  { path: '/vendor/ledger', label: 'Ledger' },
  { path: '/vendor/withdrawals', label: 'Withdrawals' },
];

export default function VendorDashboard() {
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/vendors/me')
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isOverview = location.pathname === '/vendor/dashboard' || location.pathname === '/vendor/dashboard/';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Vendor Dashboard</h1>

      {isOverview && (
        <>
          {loading ? <LoadingSpinner /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <h3 className="text-sm font-medium text-gray-500">Business</h3>
                <p className="text-lg font-semibold mt-1">{profile?.business_name || '-'}</p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <span className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  profile?.onboarding_status === 'approved' ? 'bg-green-100 text-green-800' :
                  profile?.onboarding_status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {profile?.onboarding_status || 'pending'}
                </span>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-500">Balance</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  ${parseFloat(profile?.current_balance || 0).toFixed(2)}
                </p>
              </div>
              <Link to="/vendor/withdrawals" className="card hover:shadow-md transition-shadow flex items-center justify-center">
                <span className="text-primary-600 font-medium">Withdraw Funds &rarr;</span>
              </Link>
            </div>
          )}
        </>
      )}

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = item.end ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`pb-3 text-sm font-medium whitespace-nowrap border-b-2 ${
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
