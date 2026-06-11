import { Link } from 'react-router-dom';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useCartStore } from '../stores/useCartStore';

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotal } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-8">Add some products to get started.</p>
        <Link to="/products" className="btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h1>
      <div className="space-y-4 mb-8">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="card flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <span className="text-gray-400 font-light text-xl">V</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link to={`/products/${product.id}`} className="font-semibold text-gray-900 hover:text-primary-600">
                {product.name}
              </Link>
              <p className="text-sm text-gray-500">${parseFloat(product.price).toFixed(2)} each</p>
            </div>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="px-3 py-1 hover:bg-gray-100 text-lg"
              >
                -
              </button>
              <span className="px-4 py-1 border-x border-gray-300 font-medium">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                className="px-3 py-1 hover:bg-gray-100 text-lg"
              >
                +
              </button>
            </div>
            <p className="font-semibold text-gray-900 w-24 text-right">
              ${(product.price * quantity).toFixed(2)}
            </p>
            <button onClick={() => removeItem(product.id)} className="text-red-500 hover:text-red-700 p-2">
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-primary-700">${getTotal().toFixed(2)}</span>
        </div>
        <Link to="/checkout" className="btn-primary w-full text-center block text-lg">
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
