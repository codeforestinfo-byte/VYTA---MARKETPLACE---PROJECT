import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [availabilityFilter, setAvailabilityFilter] = useState(searchParams.get('is_available') || 'all');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (availabilityFilter !== 'all') params.set('is_available', availabilityFilter);
    setSearchParams(params, { replace: true });
    try {
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await api(`/products${query}`);
      setProducts(data);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, availabilityFilter, setSearchParams]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Products</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            className="input-field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field sm:w-48"
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value)}
        >
          <option value="all">All Items</option>
          <option value="true">Available Only</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
