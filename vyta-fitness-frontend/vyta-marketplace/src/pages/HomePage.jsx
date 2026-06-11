import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/products?is_available=true')
      .then((data) => setFeatured(data.slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Your Premium Fitness Marketplace
            </h1>
            <p className="text-lg text-primary-100 mb-8">
              Discover top-quality supplements, gear, and nutrition plans from verified vendors.
            </p>
            <div className="flex gap-4">
              <Link to="/products" className="bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
                Shop Now
              </Link>
              <Link to="/register" className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                Become a Vendor
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link to="/products" className="text-primary-600 hover:text-primary-700 font-medium">
            View All &rarr;
          </Link>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : featured.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No products available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Are You a Fitness Brand?</h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Join Vyta Fitness as a vendor and reach thousands of fitness enthusiasts.
          </p>
          <Link to="/register" className="btn-primary text-lg px-8 py-3">
            Register as Vendor
          </Link>
        </div>
      </section>
    </div>
  );
}
