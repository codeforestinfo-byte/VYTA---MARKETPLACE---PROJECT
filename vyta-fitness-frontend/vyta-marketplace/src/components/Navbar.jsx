import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCartIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';

export default function Navbar() {
  const { token, role, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-xl font-bold text-primary-700">
            Vyta Fitness
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/products" className="text-gray-600 hover:text-primary-600 font-medium">
              Products
            </Link>

            <Link to="/cart" className="relative text-gray-600 hover:text-primary-600">
              <ShoppingCartIcon className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {token ? (
              <div className="flex items-center gap-3">
                <Link
                  to={
                    role === 'vendor'
                      ? '/vendor/dashboard'
                      : role === 'admin'
                      ? '/admin/dashboard'
                      : '/dashboard'
                  }
                  className="text-gray-600 hover:text-primary-600"
                >
                  <UserCircleIcon className="h-6 w-6" />
                </Link>
                <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
