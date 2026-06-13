import React, { useState } from 'react';
import { X, Check, ShoppingCart, ShieldAlert, Award, Star, Truck, RefreshCw, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { renderStars } from './ProductCard';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  deliveryRegion: string;
}

export function starRating(rating: number) {
  return renderStars(rating);
}

export default function ProductDetailsModal({
  product,
  onClose,
  onAddToCart,
  deliveryRegion,
}: ProductDetailsModalProps) {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setAddedMessage(true);
    setTimeout(() => {
      setAddedMessage(false);
    }, 2500);
  };

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  // Mock reviewer listings
  const testReviews = [
    { name: 'Marcus Steel (Calisthenics Coach)', rating: 5, date: 'May 12, 2026', comment: 'Absolutely flawless handle knurling. Highly robust, no shifting rubbers.' },
    { name: 'Sarah Lifter (Sports Nutrition)', rating: 4, date: 'April 28, 2026', comment: 'Extremely durable construction for daily heavy deads. Fits perfectly in small corners.' },
    { name: 'David G. (Home Athlete)', rating: 5, date: 'June 01, 2026', comment: 'Shipping to Sri Lanka was remarkably quick. High quality packaging.' }
  ];

  return (
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60" id="product-details-modal-wrapper">
      {/* Container Card */}
      <div className="bg-[#f7f7f7] rounded-xl shadow-2xl max-w-5xl w-full h-full max-h-[90vh] overflow-hidden flex flex-col text-gray-850 animate-in zoom-in-95 duration-150">
        
        {/* Custom Nav Header wrapper */}
        <div className="bg-[#132836] text-white px-5 py-3.5 flex justify-between items-center shrink-0 bg-brand-primary">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-[#1c3d52] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full text-white">
              Department: {product.category}
            </span>
            <span className="hidden sm:inline-block text-xs text-blue-100">
              | Provided by premium vendor: <strong className="text-white underline">{product.vendorName}</strong>
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-[#1c3d52] transition cursor-pointer"
            id="modal-close-button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Huge High-quality product photo */}
            <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-center aspect-square shadow-sm">
              <img
                src={product.image}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full rounded-md object-contain"
                id="modal-main-image"
              />
            </div>

            {/* Center Column: Specification log & details */}
            <div className="lg:col-span-4 space-y-4 text-left">
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight mb-2 font-display" id="modal-product-title">
                  {product.title}
                </h1>
                
                {/* Brand Store link */}
                <p className="text-xs text-[#1c3d52] hover:text-[#132836] hover:underline cursor-pointer font-semibold mb-2">
                  Visit the {product.vendorName} Store page
                </p>

                {/* Rating summary */}
                <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-gray-200">
                  <span className="text-sm font-semibold text-gray-900">{product.rating} out of 5</span>
                  <div className="flex items-center gap-0.5">
                    {starRating(product.rating)}
                  </div>
                  <span className="text-xs text-gray-500">({product.reviewsCount} global reviews)</span>
                </div>
              </div>

              {/* Price display blocks */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-red-600 font-bold uppercase tracking-wider">Discount:</span>
                  <span className="text-3xl font-extrabold text-red-650 font-display">
                    ${product.price.toFixed(2)}
                  </span>
                </div>
                {product.originalPrice && (
                  <p className="text-xs text-gray-500">
                    Was list price:{' '}
                    <span className="line-through">${product.originalPrice.toFixed(2)}</span>{' '}
                    <span className="text-red-650 font-bold">({discountPercent}% savings)</span>
                  </p>
                )}
                <p className="text-[10px] text-gray-500 italic">Inclusive of all local athlete clearance charges.</p>
              </div>

              {/* Bullet Features */}
              <div className="pt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 mb-2">About this athletic gear item:</h4>
                <ul className="text-xs text-gray-700 space-y-1.5 list-disc pl-5">
                  {product.features.map((feat, index) => (
                    <li key={index} className="leading-normal">{feat}</li>
                  ))}
                </ul>
              </div>

              {/* Description */}
              <div className="pt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 mb-1">Product Description:</h4>
                <p className="text-xs text-gray-600 leading-relaxed bg-white p-3 rounded-lg border border-gray-105">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Right Column: Checkout, Stocks & Delivery specs panel */}
            <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-4 text-left shadow-sm space-y-4">
              <div>
                <span className="text-2xl font-black text-gray-900 font-display">${product.price.toFixed(2)}</span>
                <p className="text-[10px] text-gray-500 mt-1">Get standard delivery shipping with full freight insurance.</p>
              </div>

              {/* Direct Air Shipping specifications */}
              <div className="space-y-1.5 text-xs text-gray-700 border-t border-b border-gray-100 py-3">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Truck className="h-4 w-4 text-[#1c3d52] shrink-0" />
                  <span>Ships directly to <strong className="text-gray-900">{deliveryRegion}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <RefreshCw className="h-4 w-4 text-[#1c3d52] shrink-0" />
                  <span>Eligible for <strong>30-Day returns</strong></span>
                </div>
              </div>

              {/* Stock Status Indicator */}
              <div className="space-y-2">
                <div>
                  {product.stock > 0 ? (
                    <span className="text-[#1c3d52] font-bold block text-sm">✓ In Stock & Verified</span>
                  ) : (
                    <span className="text-red-650 font-bold block text-sm">Currently Out of Stock</span>
                  )}
                  <p className="text-[10px] text-gray-500 mt-0.5">Secure item packed by seller "{product.vendorName}"</p>
                </div>

                {product.stock > 0 && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="modal-quantity-select" className="text-xs text-gray-600">Qty:</label>
                    <select
                      id="modal-quantity-select"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="border border-gray-300 rounded px-2.5 py-1 text-xs outline-none bg-gray-50"
                    >
                      {[...Array(Math.min(product.stock, 10))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {product.stock > 0 ? (
                  <>
                    <button
                      onClick={handleAddToCart}
                      className="w-full py-2 bg-[#1b73b3] hover:bg-[#145a8a] text-black font-extrabold text-xs rounded shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                      id="modal-add-to-cart-btn"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to Shopping Cart
                    </button>

                    {addedMessage && (
                      <div className="bg-amber-50 text-[#132836] text-[11px] p-2 rounded flex items-center gap-1 border border-amber-200 animate-in fade-in duration-200">
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span>Added successfully to your cart!</span>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 bg-gray-200 text-gray-500 text-xs font-bold rounded cursor-not-allowed text-center"
                  >
                    Out of Stock
                  </button>
                )}
              </div>

              {/* Gifting details */}
              <p className="text-[10px] text-gray-500 leading-tight">
                Gift Options: Add custom greetings, wrap covers, or include a specialized coaching guide voucher under cart during checkout processing.
              </p>
            </div>
          </div>

          {/* Customer Reviews Session details */}
          <div className="border-t border-gray-200 pt-5 text-left">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#132836] border-b border-gray-150 pb-2 mb-4 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#1b73b3]" />
              Verified Customer Feedback ({product.reviewsCount})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {testReviews.map((rev, idx) => (
                <div key={idx} className="bg-white p-3.5 rounded-lg border border-gray-150 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">{rev.name}</span>
                      <span className="text-[10px] text-gray-400">{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {starRating(rev.rating)}
                    </div>
                    <p className="text-xs text-gray-600 italic leading-relaxed">"{rev.comment}"</p>
                  </div>
                  <span className="text-[9px] text-[#1c3d52] font-bold mt-2 flex items-center gap-1">
                    Verified Athlete Purchase
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
