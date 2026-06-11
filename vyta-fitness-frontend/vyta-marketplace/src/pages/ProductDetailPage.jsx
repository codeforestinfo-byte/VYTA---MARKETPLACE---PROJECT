import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { api } from '../api';
import { useCartStore } from '../stores/useCartStore';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    api(`/products/${id}`)
      .then(setProduct)
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!product) return <div className="text-center py-16 text-gray-500">Product not found</div>;

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`Added ${quantity} item(s) to cart`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to="/products" className="text-primary-600 hover:text-primary-700 mb-6 inline-block">
        &larr; Back to Products
      </Link>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-400 text-6xl font-light">V</div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <p className="text-3xl font-bold text-primary-700 mb-4">
            ${parseFloat(product.price).toFixed(2)}
          </p>
          <p className="text-gray-600 mb-6">{product.description || 'No description available.'}</p>
          <div className="flex items-center gap-2 mb-6">
            {product.stock_quantity > 0 ? (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                In Stock ({product.stock_quantity} available)
              </span>
            ) : (
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                Out of Stock
              </span>
            )}
          </div>

          {product.is_available && product.stock_quantity > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-4 py-2 border-x border-gray-300 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={!product.is_available || product.stock_quantity <= 0}
            className="btn-primary flex items-center gap-2 text-lg px-8 py-3"
          >
            <ShoppingCartIcon className="h-5 w-5" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
