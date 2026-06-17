import React from 'react';
import { ShoppingBag, Truck, CheckCircle2, Package, Dumbbell, ShieldAlert } from 'lucide-react';
import { Order } from '../types';

interface OrdersViewProps {
  orders: Order[];
  currentUser: any;
  onGoHome: () => void;
}

export default function OrdersView({ orders, currentUser, onGoHome }: OrdersViewProps) {
  // Filter for currently logged in buyer
  const buyerEmail = currentUser ? currentUser.email : 'guest@vyta.com';
  const buyerOrders = orders.filter((o) => o.buyerEmail === buyerEmail);

  return (
    <div className="bg-[#f7f7f7] text-gray-850 py-8 font-sans text-left" id="orders-buyer-view-root">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        
        {/* Orders Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm text-left">
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 font-display flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-[#1c3d52]" />
            Your Supplement Order History
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track pending shipments, inspect items, print raw receipts, or initiate high-weight returns for dumbbells & kettlebells.
          </p>
        </div>

        {buyerOrders.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border shadow-xs max-w-md mx-auto">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-sm text-gray-700">No nutrition purchases recorded yet.</h3>
            <p className="text-xs text-gray-400 mt-1">Add items to your cart, fill in secure settlement details, and confirm to build history!</p>
            <button
              onClick={onGoHome}
              className="mt-5 px-5 py-2 bg-[#1b73b3] hover:bg-[#145a8a] text-black font-extrabold text-xs rounded shadow transition cursor-pointer"
            >
              Start Supplement Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4" id="buyer-orders-list-wrapper">
            {buyerOrders.map((ord) => {
              const dateStr = new Date(ord.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });

              return (
                <div key={ord.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm text-left">
                  {/* Order Top Bar header */}
                  <div className="bg-gray-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-gray-200">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase font-bold">Placed on</span>
                        <span className="font-bold text-gray-800">{dateStr}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase font-bold">Total Bill</span>
                        <span className="font-extrabold text-gray-900 font-display">${ord.totalAmount.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase font-bold">Shipped Region</span>
                        <span className="font-medium text-gray-700 truncate max-w-[120px] inline-block">{ord.deliveryAddress.split(',').pop()?.trim()}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[9px] uppercase font-bold text-right">Order Ref</span>
                      <strong className="text-[#1c3d52] font-mono">{ord.id}</strong>
                    </div>
                  </div>

                  {/* Body details */}
                  <div className="p-4 flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-1 space-y-3.5">
                      <h3 className="text-sm font-bold text-gray-900">
                        {ord.status === 'Delivered' 
                          ? '✓ Fully delivered & Verified' 
                          : `Shipping Progress: Status is "${ord.status}"`}
                      </h3>

                      {/* Simple Progress Mile Bar */}
                      <div className="max-w-md bg-gray-200 h-2 rounded-full overflow-hidden relative flex items-center">
                        <div 
                          className="bg-[#1c3d52] h-full transition-all duration-500" 
                          style={{ 
                            width: 
                              ord.status === 'Pending' ? '25%' :
                              ord.status === 'Processing' ? '50%' :
                              ord.status === 'Shipped' ? '75%' : '100%' 
                          }}
                        />
                      </div>

                      <div className="flex justify-between max-w-md text-[9px] font-bold uppercase tracking-wider text-gray-400 select-none">
                        <span className={ord.status === 'Pending' ? 'text-[#1c3d52] font-black' : ''}>Pending</span>
                        <span className={ord.status === 'Processing' ? 'text-[#1c3d52] font-black' : ''}>Processing</span>
                        <span className={ord.status === 'Shipped' ? 'text-[#1c3d52] font-black' : ''}>Shipped</span>
                        <span className={ord.status === 'Delivered' ? 'text-[#132836] font-black' : ''}>Delivered</span>
                      </div>

                      {/* Ordered Items rows */}
                      <div className="space-y-2 pt-3 border-t border-gray-100">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex gap-3 items-center text-xs">
                            <img
                              src={it.image}
                              alt={it.title}
                              referrerPolicy="no-referrer"
                              className="h-10 w-10 object-cover rounded border bg-gray-50"
                            />
                            <div className="leading-tight">
                              <span className="font-bold text-gray-900 block line-clamp-1">{it.title}</span>
                              <span className="text-[10px] text-gray-400">Sold by verified merchant ID: {it.vendorId}</span>
                              <span className="text-[11px] block text-[#1c3d52] font-semibold mt-0.5">
                                {it.quantity} units x ${it.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Left details - Address and Advice */}
                    <div className="bg-[#1c3d52]/5 p-4 rounded-lg border border-[#1c3d52]/15 w-full md:w-60 text-xs text-gray-850 leading-relaxed text-left space-y-2 shrink-0">
                      <span className="font-bold uppercase text-[9px] tracking-wider text-[#1c3d52] block border-b border-[#1c3d52]/15 pb-1">
                        Delivery Logistics Advice
                      </span>
                      <p className="text-[11px]">
                        <strong>Recipient Address:</strong><br />
                        {ord.deliveryAddress}
                      </p>
                      
                      <p className="text-[10px] text-[#1c3d52] font-light pt-1">
                        Heavy weight cargos like IronForce racks & dumbbells are cleared seamless at airport cargo bays via VYTA duty clearances. Keep your mobile phone active.
                      </p>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
