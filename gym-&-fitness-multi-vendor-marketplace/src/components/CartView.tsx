import React, { useState } from 'react';
import { ShoppingCart, Trash2, ArrowRight, CheckCircle2, ShieldCheck, MapPin, Truck, Award } from 'lucide-react';
import { Product, CartItem, Order } from '../types';

interface CartViewProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckoutComplete: (order: Order) => void;
  currentUser: any;
  deliveryRegion: string;
}

export default function CartView({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckoutComplete,
  currentUser,
  deliveryRegion,
}: CartViewProps) {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'billing' | 'victory'>('cart');
  const [address, setAddress] = useState('32 Temple Road, Colombo 03, Sri Lanka');
  const [cardName, setCardName] = useState(currentUser ? currentUser.name : 'Guest Athlete');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const LKR_EXCHANGE_RATE = 302.50; // Sri Lankan Rupee

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const vat = subtotal * 0.08; // 8% Vat
  const shippingFee = subtotal > 150 ? 0 : (shippingMethod === 'standard' ? 15.00 : 35.00);
  const grandTotal = subtotal + vat + shippingFee;

  const totalInLKR = grandTotal * LKR_EXCHANGE_RATE;
  const itemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    const newOrder: Order = {
      id: 'ORD_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      buyerEmail: currentUser ? currentUser.email : 'guest@vyta.com',
      buyerName: currentUser ? currentUser.name : 'Guest Athletic Purchaser',
      items: cartItems.map((item) => ({
        productId: item.product.id,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image,
        vendorId: item.product.vendorId
      })),
      totalAmount: grandTotal,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      deliveryAddress: address,
    };

    setCreatedOrder(newOrder);
    setCheckoutStep('victory');
    onClearCart();
    onCheckoutComplete(newOrder);
  };

  if (checkoutStep === 'victory') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#f7f7f7] py-12 px-4" id="victory-screen-root">
        <div className="bg-white rounded-xl shadow-lg border border-gray-150 p-8 max-w-lg w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="mx-auto w-16 h-16 bg-[#1c3d52]/20 rounded-full flex items-center justify-center text-[#1c3d52] animate-bounce">
            <CheckCircle2 className="h-10 w-10 text-[#1c3d52]" />
          </div>

          <div className="leading-snug">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#132836] bg-amber-50 px-3 py-1 rounded">
              Order Transmitted
            </span>
            <h2 className="text-2xl font-black text-gray-900 font-display mt-2">Order Confirmed!</h2>
            <p className="text-xs text-gray-500 mt-1">
              Your VYTA order ID is <strong className="text-gray-800 font-mono text-sm">{createdOrder?.id}</strong>.
            </p>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto bg-gray-50 p-4 border border-gray-150 rounded-lg text-left">
            Your heavy gears have been safely registered with our verified merchant sellers. Raw packing slips have been forwarded to <strong className="text-[#132836]">{createdOrder?.buyerEmail}</strong>. Expected delivery tracking updates will be broadcast shortly.
          </p>

          <div className="border-t border-gray-100 pt-5 text-left text-xs space-y-2">
            <div className="flex justify-between font-bold text-gray-900">
              <span>Delivery Address:</span>
              <span className="text-right font-light text-gray-600 truncate max-w-[200px]">{createdOrder?.deliveryAddress}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900">
              <span>Total Debited Amount:</span>
              <span className="text-[#132836] font-extrabold font-display">${createdOrder?.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t border-dashed border-gray-150 pt-2 text-[11px]">
              <span>In LKR Sri Lankan Rupees:</span>
              <span className="text-[#132836]">LKR {(createdOrder ? (createdOrder.totalAmount * LKR_EXCHANGE_RATE) : 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <button
            onClick={() => setCheckoutStep('cart')}
            className="w-full py-2.5 bg-[#1b73b3] hover:bg-[#145a8a] text-white font-extrabold text-xs rounded shadow transition cursor-pointer"
            id="victory-back-btn"
          >
            Acknowledge & Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
     <div className="bg-[#f7f7f7] text-gray-850 py-8" id="cart-root-page">
      <div className="max-w-6xl mx-auto px-4">
        
        {checkoutStep === 'cart' ? (
          /* CART CONTENT */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="cart-main-layout">
            
            {/* Left Column: Cart items table list */}
            <div className="lg:col-span-8 bg-white border border-gray-200 rounded-lg p-5 text-left shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 font-display flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6 text-[#1c3d52]" />
                  Your VYTA Cart
                </h1>
                <span className="text-xs text-gray-500">Price in USD / LKR Conversion auto applied</span>
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-bold text-sm text-gray-700">Your Supplement Shopping cart is currently empty.</h3>
                  <p className="text-xs text-gray-400 mt-1">Browse our rich departments for premium rack cages, proteins, and supplements.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-150 space-y-4">
                  {cartItems.map((item) => {
                    const discountPercent = item.product.originalPrice 
                      ? Math.round(((item.product.originalPrice - item.product.price) / item.product.originalPrice) * 100) 
                      : 0;

                    return (
                      <div key={item.product.id} className="pt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex gap-4 items-center flex-1">
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            referrerPolicy="no-referrer"
                            className="h-20 w-20 rounded object-cover border border-gray-200 shrink-0 bg-gray-50"
                          />
                          <div className="space-y-1 text-left">
                            <h3 className="font-bold text-xs text-gray-900 line-clamp-1 hover:text-[#132836] cursor-pointer">
                              {item.product.title}
                            </h3>
                            <p className="text-[10px] text-[#1c3d52] font-bold uppercase tracking-wider flex items-center gap-1">
                              Provided by: <span className="underline">{item.product.vendorName}</span>
                            </p>
                            <p className="text-[11px] text-gray-500">
                              Direct Air freight available to <strong>{deliveryRegion}</strong>
                            </p>

                            {/* Quantity Adjustments row */}
                            <div className="flex items-center gap-4 pt-1">
                              <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-300 rounded px-2 py-0.5">
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                                  className="text-gray-700 font-bold hover:text-[#1b73b3] hover:scale-110 text-xs cursor-pointer select-none px-1"
                                >
                                  -
                                </button>
                                <span className="text-xs font-bold font-mono px-2 text-gray-900">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(item.product.id, Math.min(item.product.stock, item.quantity + 1))}
                                  className="text-gray-700 font-bold hover:text-[#1b73b3] hover:scale-110 text-xs cursor-pointer select-none px-1"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                onClick={() => onRemoveItem(item.product.id)}
                                className="text-red-650 hover:text-red-750 font-bold text-[10px] flex items-center gap-1 border border-transparent hover:border-red-200 hover:bg-red-50 rounded px-1.5 py-0.5 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5 inline text-red-600" />
                                <span>Delete Item</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Price Breakdown column */}
                        <div className="text-right shrink-0">
                          <span className="text-sm font-extrabold text-gray-900 font-display block">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            (${item.product.price.toFixed(2)} each)
                          </span>
                          {item.product.originalPrice && (
                            <span className="inline-block text-[9px] bg-red-100 text-red-700 font-bold uppercase rounded px-1 py-0.2 mt-1">
                              {discountPercent}% saved
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Calculations & Checkout widgets panel */}
            <div className="lg:col-span-4 bg-white border border-gray-200 rounded-lg p-5 text-left shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-gray-950 uppercase tracking-wider border-b border-gray-150 pb-2">Subtotal Calculations</h3>

              <div className="space-y-2 text-xs text-gray-600 font-medium">
                <div className="flex justify-between">
                  <span>Base sum ({itemsCount} items):</span>
                  <span className="font-bold text-gray-900 font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Merchant platform VAT (8%):</span>
                  <span className="font-bold text-gray-900 font-mono">${vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Freight Standard Cargo:</span>
                  <span className="font-bold text-[#1c3d52] font-mono">
                    {shippingFee === 0 ? 'FREE (Over $150)' : `$${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                
                <div className="border-t border-gray-150 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-extrabold text-gray-900">Grand Total:</span>
                  <div className="text-right">
                    <span className="text-xl font-black text-[#132836] font-display block">${grandTotal.toFixed(2)}</span>
                    {/* Live LKR conversion */}
                    <span className="text-[10px] font-bold text-[#1c3d52] block mt-0.5">
                      LKR {totalInLKR.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action triggers */}
              {cartItems.length > 0 ? (
                <button
                  onClick={() => setCheckoutStep('billing')}
                  className="w-full py-2.5 bg-[#1b73b3] hover:bg-[#145a8a] text-white font-extrabold text-xs rounded shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                  id="checkout-proceed-btn"
                >
                  <span>Proceed to Supplement Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 bg-gray-200 text-gray-400 text-xs font-bold rounded cursor-not-allowed text-center"
                >
                  Empty Cart
                </button>
              )}

              {/* Guarantees */}
              <div className="pt-2 border-t border-gray-100 flex items-center gap-3 text-[10px] text-gray-500 bg-[#1c3d52]/10 p-2.5 rounded">
                <ShieldCheck className="h-10 w-10 text-[#1c3d52] shrink-0" />
                <div className="leading-snug">
                  <h4 className="font-bold text-gray-800">100% SECURE TRANSACTIONS</h4>
                  <p>Our decentralized escrow secures payment until dumbbells & items clear your local customs.</p>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* BILLING STEP */
          <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg p-6 text-left shadow" id="cart-billing-layout">
            <h2 className="text-lg font-extrabold text-gray-950 font-display mb-4 flex items-center gap-1">
              <MapPin className="h-5 w-5 text-[#1c3d52]" />
              Secure Shipping & Athlete Settlement Details
            </h2>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">
                  Recipient Full Name
                </label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="John Liftman"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs outline-none focus:border-[#1c3d52]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">
                  Delivery Destination Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="32 Temple Road, Colombo 03, Sri Lanka"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs outline-none focus:border-[#1c3d52]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1">
                    Air Freight Dispatch Method
                  </label>
                  <div className="space-y-1.5 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                      <input
                        type="radio"
                        checked={shippingMethod === 'standard'}
                        onChange={() => setShippingMethod('standard')}
                        className="text-[#1c3d52]"
                      />
                      <span>Standard Aeropost (LKR 4,500)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                      <input
                        type="radio"
                        checked={shippingMethod === 'express'}
                        onChange={() => setShippingMethod('express')}
                        className="text-[#1c3d52]"
                      />
                      <span>Express Space Freight (LKR 10,550)</span>
                    </label>
                  </div>
                </div>

                <div className="bg-[#1c3d52]/10 rounded p-2.5 border border-[#1c3d52]/20 leading-snug text-[10px] text-[#132836]">
                  <span className="font-bold uppercase tracking-wider block mb-1">Standard Delivery Area</span>
                  Ships securely from verified manufacturers with full tracking numbers to <strong>{deliveryRegion}</strong>.
                </div>
              </div>

              {/* Simulated Card payments */}
              <div className="pt-2.5 border-t border-gray-150 space-y-3">
                <span className="block text-xs font-bold text-gray-950 uppercase tracking-widest text-[#132836]">Simulated Payment Details</span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-gray-500 mb-1">Secure Credit Card Number</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4111 2222 3333 4444"
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-mono outline-none focus:border-[#1c3d52]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Expiry CVV</label>
                    <input
                      type="text"
                      required
                      defaultValue="09/29 (123)"
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-mono outline-none focus:border-[#1c3d52] bg-gray-50 text-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Order total logs summary */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-baseline text-xs text-gray-700 font-bold uppercase">
                <span>Summary amount due:</span>
                <div className="text-right">
                  <span className="text-base text-red-650 font-display block font-black">${grandTotal.toFixed(2)}</span>
                  <span className="font-mono text-[10px] text-[#132836] block">LKR {totalInLKR.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-150 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded cursor-pointer"
                >
                  Cancel & Return
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1b73b3] hover:bg-[#145a8a] text-white font-extrabold text-xs rounded shadow transition cursor-pointer flex items-center gap-1"
                >
                  <Award className="h-4 w-4" />
                  <span>Place VYTA Order</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
