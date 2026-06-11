import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuthStore } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { token } = useAuthStore();
  const { items, getTotal, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in to Checkout</h1>
        <p className="text-gray-500 mb-8">You need to be logged in as a customer to place an order.</p>
        <Link to="/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      const order = await api('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.product.id,
            quantity: i.quantity,
          })),
        }),
      });
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/dashboard/orders');
    } catch (err) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {product.name} x {quantity}
                </span>
                <span className="font-medium">${(product.price * quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-xl text-primary-700">${getTotal().toFixed(2)}</span>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Place Your Order</h2>
          <p className="text-sm text-gray-500 mb-6">
            By placing this order, you agree to our terms and conditions.
          </p>
          <button
            onClick={handlePlaceOrder}
            disabled={submitting}
            className="btn-primary w-full text-lg"
          >
            {submitting ? 'Processing...' : `Pay $${getTotal().toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
