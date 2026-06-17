import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Users,
  Banknote,
  CalendarCheck,
  BarChart3,
  Settings,
  UserCircle,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/vendors', label: 'Vendors', icon: Store },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/withdrawals', label: 'Withdrawals', icon: Banknote },
  { path: '/consultations', label: 'Consultations', icon: CalendarCheck },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/profile', label: 'Admin Profile', icon: UserCircle },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">VYTA Admin</h1>
                  <p className="text-xs text-gray-500">Management Panel</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3 px-4 py-2">
              <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center gap-4 lg:gap-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">{user?.email}</span>
            <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
