import React, { useState } from 'react';
import { Award, Package, Shield, TrendingUp, PlusCircle, CheckCircle, Ship, AlertCircle, ShoppingBag, LayoutDashboard, Settings } from 'lucide-react';
import { Product, Vendor, Order } from '../types';

interface VendorDashboardProps {
  currentUser: any;
  products: Product[];
  onAddProduct: (newProduct: Product) => void;
  onUpdateProductStock: (productId: string, newStock: number) => void;
  onUpdateProductPrice: (productId: string, newPrice: number) => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered') => void;
  vendors: Vendor[];
}

export default function VendorDashboard({
  currentUser,
  products,
  onAddProduct,
  onUpdateProductStock,
  onUpdateProductPrice,
  orders,
  onUpdateOrderStatus,
  vendors,
}: VendorDashboardProps) {
  // Find currently logged-in vendor's profile
  const matchedVendor = vendors.find(v => v.email === currentUser?.email) || {
    id: 'vendor_custom_active',
    storeName: currentUser ? `${currentUser.name}'s Nutrition Co.` : 'Guest Supplement Brand',
    logo: 'Gym',
    description: 'Premium sports nutrition and supplement catalog.',
    region: 'Sri Lanka',
    earnings: 2850.00,
    rating: 4.8
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'add_product' | 'orders'>('overview');
  
  // Form states for listing new product
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('49.99');
  const [newOriginalPrice, setNewOriginalPrice] = useState('74.99');
  const [newStock, setNewStock] = useState('15');
  const [newCategory, setNewCategory] = useState('Whey Protein');
  const [newImage, setNewImage] = useState('https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=400');
  const [newDescription, setNewDescription] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState('');

  // Sample gym image tags for fast, beautiful mockup selections
  const presetImages = [
    { name: 'Premium Protein supplements', url: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&q=80&w=400' },
    { name: 'Whey protein canisters display', url: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&q=80&w=400' },
    { name: 'Creatine & pre-workout jars', url: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&q=80&w=400' },
    { name: 'Plant protein organic blends', url: 'https://images.unsplash.com/photo-1622485831022-f0babf1b3a7a?auto=format&fit=crop&q=80&w=400' },
    { name: 'BCAA recovery supplement tubs', url: 'https://images.unsplash.com/photo-1579722820308-d74e5715c1d5?auto=format&fit=crop&q=80&w=400' },
  ];

  // Logic: Filter products relevant for active vendor
  const vendorProducts = products.filter(p => p.vendorId === matchedVendor.id || p.vendorId === 'vendor_custom_active');

  // Logic: Filter orders containing products from active vendor
  const vendorOrders = orders.filter(ord => 
    ord.items.some(item => item.vendorId === matchedVendor.id || item.vendorId === 'vendor_custom_active')
  );

  const totalSalesCount = vendorOrders.filter(o => o.status === 'Delivered').length;
  const activeOrdersCount = vendorOrders.filter(o => o.status !== 'Delivered').length;

  // Add bullet features
  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    setFeaturesList([...featuresList, newFeature.trim()]);
    setNewFeature('');
  };

  const handleClearFeatures = () => {
    setFeaturesList([]);
  };

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice) return;

    const parsedPrice = parseFloat(newPrice) || 0;
    const parsedOriginal = parseFloat(newOriginalPrice) || undefined;
    const parsedStock = parseInt(newStock) || 5;

    const fullNewProduct: Product = {
      id: 'p_vendor_custom_' + Date.now().toString(),
      vendorId: matchedVendor.id || 'vendor_custom_active',
      vendorName: matchedVendor.storeName,
      title: newTitle,
      price: parsedPrice,
      originalPrice: parsedOriginal,
      rating: 5.0,
      reviewsCount: 1,
      category: newCategory,
      image: newImage,
      description: newDescription || `Premium high quality active ${newCategory} item carefully crafted by ${matchedVendor.storeName}.`,
      features: featuresList.length > 0 ? featuresList : ['Premium quality ingredients', 'Third-party lab tested for purity'],
      stock: parsedStock,
      isDeal: false
    };

    onAddProduct(fullNewProduct);
    setPublishSuccessMsg('Product launched successfully inside the VYTA mall catalog!');
    
    // reset
    setNewTitle('');
    setNewPrice('39.99');
    setNewOriginalPrice('59.99');
    setNewStock('10');
    setFeaturesList([]);
    setNewDescription('');

    setTimeout(() => {
      setPublishSuccessMsg('');
      setActiveTab('inventory');
    }, 1500);
  };

  return (
    <div className="bg-[#f7f7f7] text-gray-850 py-8 font-sans text-left" id="vendor-dashboard-root">
      <div className="max-w-6xl mx-auto px-4 space-y-6 px-1 lg:px-4">
        
        {/* Merchant Dashboard Header banner card block */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-[#132836] text-white flex items-center justify-center rounded-lg text-2xl font-bold select-none">
              {matchedVendor.logo || 'Sup'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-[#1c3d52]/15 text-[#132836] border border-[#1c3d52]/20 font-bold px-2 py-0.5 rounded-full uppercase">
                  Verified Supplement Seller
                </span>
                <span className="text-xs text-gray-400">ID: {matchedVendor.id}</span>
              </div>
              <h1 className="text-xl font-extrabold text-gray-900 font-display mt-0.5" id="vendor-store-title">
                {matchedVendor.storeName}
              </h1>
              <p className="text-xs text-gray-500 mt-1 max-w-md line-clamp-1">{matchedVendor.description}</p>
            </div>
          </div>

          {/* Quick Stats overview bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="border-r border-gray-200 pr-4">
              <span className="text-gray-400 block">Total Earnings</span>
              <strong className="text-[#1c3d52] text-base font-display font-black">
                ${matchedVendor.earnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="border-r border-gray-200 pr-4">
              <span className="text-gray-400 block">Store Rating</span>
              <strong className="text-gray-800 text-sm flex items-center gap-1">
                {matchedVendor.rating || 4.8} / 5
              </strong>
            </div>
            <div>
              <span className="text-gray-400 block text-left">Fulfillment Region</span>
              <strong className="text-[#132836] font-semibold">{matchedVendor.region || 'Sri Lanka'}</strong>
            </div>
          </div>
        </div>

        {/* Tab Selection Switches */}
        <div className="flex border-b border-gray-200 gap-4" id="vendor-tabs-bar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition cursor-pointer select-none ${
              activeTab === 'overview' ? 'border-[#1b73b3] text-black font-extrabold' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview Stats
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition cursor-pointer select-none ${
              activeTab === 'inventory' ? 'border-[#1b73b3] text-black font-extrabold' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
            id="tab-toggle-inventory"
          >
            <Package className="h-4 w-4" />
            Manage Inventory ({vendorProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('add_product')}
            className={`pb-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition cursor-pointer select-none ${
              activeTab === 'add_product' ? 'border-[#1b73b3] text-black font-extrabold' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
            id="tab-toggle-addproduct"
          >
            <PlusCircle className="h-4 w-4" />
            Add New Product
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition cursor-pointer select-none ${
              activeTab === 'orders' ? 'border-[#1b73b3] text-black font-extrabold' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
            id="tab-toggle-orders"
          >
            <ShoppingBag className="h-4 w-4" />
            Purchase Orders ({vendorOrders.length})
          </button>
        </div>

        {/* Tab Contents 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in" id="tabcontent-overview">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs text-left">
                <span className="text-gray-400 text-xs font-medium block">Total Store Products</span>
                <strong className="text-xl font-extrabold text-gray-900 font-display block mt-1">{vendorProducts.length}</strong>
                <span className="text-[10px] text-[#1c3d52] block mt-2">Live in VYTA Mall</span>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs text-left">
                <span className="text-gray-400 text-xs font-medium block">Pending Operations</span>
                <strong className="text-xl font-extrabold text-amber-700 font-display block mt-1">{activeOrdersCount}</strong>
                <span className="text-[10px] text-amber-800 block mt-2">Awaiting dispatch processing</span>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs text-left">
                <span className="text-gray-400 text-xs font-medium block">Dispatched Sales Count</span>
                <strong className="text-xl font-extrabold text-[#1c3d52] font-display block mt-1">{totalSalesCount}</strong>
                <span className="text-[10px] text-[#1c3d52] block mt-2">✓ Safely delivered to athletes</span>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs text-left bg-[#1c3d52]/5">
                <span className="text-[#132836] text-xs font-bold block">Estimated Profit Share (USD)</span>
                <strong className="text-xl font-black text-[#1c3d52] font-display block mt-1">
                  ${(matchedVendor.earnings * 0.9).toFixed(2)}
                </strong>
                <span className="text-[10px] text-[#1c3d52] block mt-2">After VYTA platform VAT (10%)</span>
              </div>
            </div>

            {/* Simulated Sales Analytics charts */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 text-left shadow-xs">
              <div className="flex items-center justify-between border-b pb-2 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-950 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-[#1c3d52]" />
                  Store Weekly Sales Analytics simulation
                </h3>
                <span className="text-[10px] text-gray-400">Weekly resolution • June 2026</span>
              </div>
              
              {/* Minimal SVG block chart */}
              <div className="h-48 flex items-end gap-5 justify-around px-4 border-b border-gray-200 pb-2">
                <div className="w-12 text-center flex flex-col items-center gap-2">
                  <span className="text-[9px] text-[#1c3d52] font-bold font-mono">$1,850</span>
                  <div className="w-10 bg-[#1c3d52]/40 rounded-t-sm transition-all h-24" />
                  <span className="text-[9px] text-gray-400 font-medium">Week 1</span>
                </div>
                <div className="w-12 text-center flex flex-col items-center gap-2">
                  <span className="text-[9px] text-[#1c3d52] font-bold font-mono">$2,450</span>
                  <div className="w-10 bg-[#1c3d52]/70 rounded-t-sm transition-all h-32" />
                  <span className="text-[9px] text-gray-400 font-medium">Week 2</span>
                </div>
                <div className="w-12 text-center flex flex-col items-center gap-2">
                  <span className="text-[9px] text-[#1c3d52] font-bold font-mono">$3,890</span>
                  <div className="w-10 bg-[#1c3d52] rounded-t-sm transition-all h-40 animate-pulse" />
                  <span className="text-[9px] text-gray-400 font-medium">Week 3 (Current)</span>
                </div>
                <div className="w-12 text-center flex flex-col items-center gap-2">
                  <span className="text-[9px] text-gray-400 font-bold font-mono">Projected</span>
                  <div className="w-10 bg-gray-200 rounded-t-sm border border-dashed border-gray-400 h-28" />
                  <span className="text-[9px] text-gray-400 font-medium">Week 4</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-gray-500">
                <span>High velocity items: <strong className="text-gray-900">Heavy Dumbbell set pair, Grass-fed whey protein isolate</strong></span>
                <span className="text-[#1c3d52] hover:underline cursor-pointer font-bold">Download reports CSV</span>
              </div>
            </div>

            {/* Quality advice */}
            <p className="text-[11px] text-gray-500 leading-normal">
              <strong>Vendor Tip:</strong> Keep your supplement listings updated with detailed descriptions and high-quality images. Detailed product info accelerates buyer conversions by up to 30%.
            </p>
          </div>
        )}

        {/* Tab Contents 2: Inventory Grid Table */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs animate-in fade-in" id="tabcontent-inventory">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-gray-900 font-display uppercase tracking-wide">
                Publish Active Catalog Inventory
              </h3>
              <p className="text-xs text-gray-500">Adjust list prices or update raw weight plate count instantaneously</p>
            </div>

            {vendorProducts.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-gray-700">No active product listings found for your brand store profile.</h4>
                <p className="text-xs text-gray-400 mt-1">Navigate to "Add New Product" at the top to publish your first supplement.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[9px] tracking-wider">
                      <th className="p-3.5">Product info</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Price (USD)</th>
                      <th className="p-3.5">Stock Count</th>
                      <th className="p-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {vendorProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-3.5 flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.title}
                            referrerPolicy="no-referrer"
                            className="h-10 w-10 object-cover rounded border"
                          />
                          <div>
                            <span className="font-bold text-gray-900 block truncate max-w-[280px]">{p.title}</span>
                            <span className="text-[10px] text-gray-400 font-mono">SKU ID: {p.id}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-gray-650 font-medium">
                          {p.category}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-gray-900 font-mono text-sm">${p.price.toFixed(2)}</span>
                            <button
                              onClick={() => {
                                const newPStr = prompt('Enter new retail price in USD:', p.price.toString());
                                if (newPStr) {
                                  const n = parseFloat(newPStr);
                                  if (!isNaN(n) && n > 0) onUpdateProductPrice(p.id, n);
                                }
                              }}
                              className="text-[#1c3d52] hover:underline hover:text-[#132836] font-bold ml-1"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-extrabold font-mono text-sm ${p.stock <= 5 ? 'text-orange-650 animate-pulse' : 'text-gray-900'}`}>
                              {p.stock} units
                            </span>
                            <button
                              onClick={() => {
                                const newStStr = prompt('Enter new absolute inventory stock count:', p.stock.toString());
                                if (newStStr) {
                                  const n = parseInt(newStStr);
                                  if (!isNaN(n) && n >= 0) onUpdateProductStock(p.id, n);
                                }
                              }}
                              className="text-[#1c3d52] hover:underline hover:text-[#132836] font-bold ml-1"
                            >
                              Qty
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          {p.stock > 0 ? (
                            <span className="inline-block px-2.5 py-0.5 bg-[#1c3d52]/10 text-[#1c3d52] font-bold rounded-full uppercase text-[9px]">
                              Active List
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 bg-red-50 text-red-700 font-bold rounded-full uppercase text-[9px]">
                              Sold Out
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Contents 3: Add List form */}
        {activeTab === 'add_product' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-left shadow-xs space-y-6 animate-in fade-in" id="tabcontent-add-product">
            <div>
              <h3 className="text-base font-bold text-gray-950 font-display uppercase tracking-wide">
                Publish New Supplement
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Define specs, prices, and high-res sports marketing photos.</p>
            </div>

            {publishSuccessMsg && (
              <div className="bg-[#1c3d52]/10 text-[#132836] p-3 rounded font-bold border border-[#1c3d52]/15 flex items-center gap-1 text-xs">
                <CheckCircle className="h-5 w-5 text-[#1c3d52] shrink-0" />
                <span>{publishSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handlePublishSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 leading-relaxed text-xs text-gray-800">
              
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-gray-900 mb-1">
                    Athletic Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. IronForce 20kg Elite Olympic Barbell"
                    className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#1c3d52]"
                    id="new-product-title-input"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-900 mb-1">
                      Sale Price ($) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="49.99"
                      className="w-full border border-gray-300 rounded px-2.5 py-2 font-mono outline-none focus:border-[#1c3d52]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-950 mb-1">
                      Was Price ($)
                    </label>
                    <input
                      type="text"
                      value={newOriginalPrice}
                      onChange={(e) => setNewOriginalPrice(e.target.value)}
                      placeholder="74.99"
                      className="w-full border border-gray-300 rounded px-2.5 py-2 font-mono outline-none focus:border-[#1c3d52]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-950 mb-1">
                      Initial Units *
                    </label>
                    <input
                      type="number"
                      required
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      placeholder="15"
                      className="w-full border border-gray-300 rounded px-2.5 py-2 font-mono outline-none focus:border-[#1c3d52]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-900 mb-1">
                    Category Department *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-2 bg-gray-50 outline-none"
                  >
                    <option value="Whey Protein">Whey Protein</option>
                    <option value="Plant Protein">Plant Protein</option>
                    <option value="Creatine">Creatine</option>
                    <option value="BCAAs & Aminos">BCAAs & Aminos</option>
                    <option value="Pre-Workout">Pre-Workout</option>
                    <option value="Mass Gainers">Mass Gainers</option>
                    <option value="Recovery">Recovery</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-900 mb-1">
                    Describe item raw specifications *
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Provide details of item construction, dimensions, material alloy, or dietary proteins isolate profiles..."
                    rows={4}
                    className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#1c3d52] text-xs"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {/* Image Selection */}
                <div>
                  <label className="block font-bold text-gray-900 mb-1">
                    Image Showcase URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#1c3d52] font-mono text-[10px]"
                  />
                  
                  {/* Preset quick picker */}
                  <div className="mt-2">
                    <span className="text-[10px] text-gray-400 block mb-1">Quick Select High-Res Image Presets:</span>
                    <div className="flex flex-wrap gap-1">
                      {presetImages.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNewImage(p.url)}
                          className={`px-2 py-1 rounded text-[10px] border transition ${
                            newImage === p.url 
                              ? 'bg-[#1c3d52]/15 text-[#132836] border-[#1c3d52]/40 font-bold' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-250'
                          }`}
                        >
                          {p.name.split(' ')[0]} {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Features list management */}
                <div>
                  <label className="block font-bold text-gray-900 mb-1 flex justify-between items-center">
                    <span>Bullet Features ({featuresList.length} defined)</span>
                    {featuresList.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearFeatures}
                        className="text-red-600 hover:underline text-[10px] font-bold"
                      >
                        Reset Bullets
                      </button>
                    )}
                  </label>
                  <div className="flex gap-1.5 h-8">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="e.g. Molded hard safety rubbers prevents rolling"
                      className="flex-1 border border-gray-300 rounded px-2.5 py-1 text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded text-xs"
                    >
                      Add +
                    </button>
                  </div>

                  {featuresList.length > 0 && (
                    <ul className="mt-2 space-y-1 bg-gray-50 border p-2.5 rounded-lg text-[11px] list-disc pl-5 max-h-24 overflow-y-auto">
                      {featuresList.map((f, i) => (
                        <li key={i} className="text-gray-700 leading-tight">{f}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Submit actions */}
                <div className="pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#1b73b3] hover:bg-[#145a8a] text-black font-extrabold text-xs rounded shadow transition cursor-pointer text-center"
                    id="btn-publish-listing"
                  >
                    Publish Item to Active Catalog
                  </button>
                </div>
              </div>

            </form>
          </div>
        )}

        {/* Tab Contents 4: Received Orders */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg border border-gray-200 p-5 text-left shadow-xs space-y-4 animate-in fade-in" id="tabcontent-receivedorders">
            <div className="flex items-center justify-between border-b pb-2 mb-2">
              <h3 className="font-extrabold text-sm text-gray-900 font-display uppercase tracking-wide">
                Track Buyer Purchase Orders
              </h3>
              <span className="text-xs text-gray-500">Real-time platform synchronization enabled</span>
            </div>

            {vendorOrders.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-gray-700">No active client orders received for your products yet.</h4>
                <p className="text-xs text-gray-400 mt-1">Simulate ordering as a Buyer by adding to cart and proceeding to checkout!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {vendorOrders.map((ord) => {
                  
                  // Filter items in this order relevant for this specific vendor
                  const orderItemsForVendor = ord.items.filter(item => 
                    item.vendorId === matchedVendor.id || item.vendorId === 'vendor_custom_active'
                  );

                  const orderAmountForVendor = orderItemsForVendor.reduce((sum, x) => sum + (x.price * x.quantity), 0);

                  return (
                    <div key={ord.id} className="border border-gray-200 rounded-lg overflow-hidden" id={`vendor-order-block-${ord.id}`}>
                      {/* Sub-Header bar */}
                      <div className="bg-gray-50 px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs border-b border-gray-205">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <div>
                            <span className="text-gray-400 block text-[9px] uppercase font-bold">Client Order ID</span>
                            <strong className="text-gray-800 font-mono text-xs">{ord.id}</strong>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[9px] uppercase font-bold">Receipt Date</span>
                            <span className="font-medium text-gray-700">{ord.date}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[9px] uppercase font-bold">Buyer Details</span>
                            <span className="font-bold text-gray-700">{ord.buyerName}</span>
                          </div>
                        </div>

                        {/* Ship tracking status tag */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">Status:</span>
                          <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                            ord.status === 'Pending' ? 'bg-red-50 text-red-700 border border-red-100' :
                            ord.status === 'Processing' ? 'bg-amber-50 text-amber-800 border border-amber-250' :
                            ord.status === 'Shipped' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            'bg-[#1c3d52]/15 text-[#132836] border border-[#1c3d52]/30'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                      </div>

                      {/* Items & Shipping address list */}
                      <div className="p-4 flex flex-col sm:flex-row gap-5 justify-between items-start">
                        <div className="space-y-3 flex-1 text-xs">
                          <div className="text-gray-600 font-medium">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Shipping Destination</span>
                            {ord.deliveryAddress}
                          </div>

                          {/* Items table */}
                          <div className="space-y-2 pt-1 border-t border-gray-100">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Ordered Items from your store:</span>
                            {orderItemsForVendor.map((it, itemIdx) => (
                              <div key={itemIdx} className="flex gap-2 items-center">
                                <img
                                  src={it.image}
                                  alt={it.title}
                                  referrerPolicy="no-referrer"
                                  className="h-8 w-8 object-cover rounded border"
                                />
                                <div className="leading-tight">
                                  <span className="font-bold text-gray-900 block line-clamp-1">{it.title}</span>
                                  <span className="text-[10px] text-gray-500">{it.quantity} units x ${it.price.toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order action triggers */}
                        <div className="bg-gray-50/50 p-3.5 rounded-lg border border-gray-180 w-full sm:w-48 text-left space-y-3.5 shrink-0">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Your Share due</span>
                            <strong className="text-base font-extrabold text-[#1c3d52] font-display block mt-0.5">
                              ${orderAmountForVendor.toFixed(2)}
                            </strong>
                          </div>

                          {/* Status flow triggers */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Execute State Action:</span>
                            {ord.status === 'Pending' && (
                              <button
                                onClick={() => onUpdateOrderStatus(ord.id, 'Processing')}
                                className="w-full text-center py-1 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-[10px] rounded transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>Acknowledge Order</span>
                              </button>
                            )}
                            {ord.status === 'Processing' && (
                              <button
                                onClick={() => onUpdateOrderStatus(ord.id, 'Shipped')}
                                className="w-full text-center py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Ship className="h-3.5 w-3.5" />
                                <span>Ship Cargo Cargo</span>
                              </button>
                            )}
                            {ord.status === 'Shipped' && (
                              <button
                                onClick={() => onUpdateOrderStatus(ord.id, 'Delivered')}
                                className="w-full text-center py-1 bg-[#1b73b3] hover:bg-[#145a8a] text-black font-extrabold text-[10px] rounded transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Complete Delivery</span>
                              </button>
                            )}
                            {ord.status === 'Delivered' && (
                              <span className="text-[10px] text-[#132836] font-bold block text-center py-1 bg-[#1c3d52]/15 rounded">
                                ✓ Fully Transmitted
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
