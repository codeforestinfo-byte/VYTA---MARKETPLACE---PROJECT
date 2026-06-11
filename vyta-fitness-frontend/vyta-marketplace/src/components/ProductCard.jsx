import { Link } from 'react-router-dom';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCartStore } from '../stores/useCartStore';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!product.is_available || product.stock_quantity <= 0) {
      toast.error('Product is not available');
      return;
    }
    addItem(product);
    toast.success('Added to cart');
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="card group hover:shadow-md transition-shadow flex flex-col"
    >
      <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="text-gray-400 text-4xl font-light">V</div>
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary-700">
            ${parseFloat(product.price).toFixed(2)}
          </span>
          {product.stock_quantity > 0 ? (
            <span className="text-xs text-green-600">In Stock ({product.stock_quantity})</span>
          ) : (
            <span className="text-xs text-red-500">Out of Stock</span>
          )}
        </div>
      </div>
      <button
        onClick={handleAddToCart}
        disabled={!product.is_available || product.stock_quantity <= 0}
        className="btn-primary w-full mt-4 flex items-center justify-center gap-2 text-sm"
      >
        <ShoppingCartIcon className="h-4 w-4" />
        Add to Cart
      </button>
    </Link>
  );
}
