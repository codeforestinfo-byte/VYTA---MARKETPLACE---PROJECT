import { Link, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/admin/dashboard', label: 'Overview', end: true },
  { path: '/admin/dashboard/orders', label: 'Orders' },
  { path: '/admin/dashboard/customers', label: 'Customers' },
  { path: '/admin/dashboard/vendors', label: 'Vendors' },
  { path: '/admin/dashboard/products', label: 'Products' },
  { path: '/admin/dashboard/consultations', label: 'Consultations' },
  { path: '/admin/dashboard/withdrawals', label: 'Withdrawals' },
  { path: '/admin/dashboard/profile', label: 'Profile' },
];

export default function AdminDashboard() {
  const location = useLocation();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="flex gap-6 min-w-max">
          {navItems.map((item) => {
            const isActive = item.end ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`pb-3 text-sm font-medium border-b-2 whitespace-nowrap ${
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
