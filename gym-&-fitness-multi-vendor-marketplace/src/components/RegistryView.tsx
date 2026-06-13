import React, { useState } from 'react';
import { Gift, Globe, RefreshCcw, Sparkles, Check, ListChecks } from 'lucide-react';
import { REGISTRY_INSPIRATIONS } from '../data';
import { Product, Registry, RegistryItem } from '../types';

interface RegistryViewProps {
  products: Product[];
  onAddToCart: (product: Product, quantity: number) => void;
  currentUser: any;
}

export default function RegistryView({ products, onAddToCart, currentUser }: RegistryViewProps) {
  const [registries, setRegistries] = useState<Registry[]>([
    {
      id: 'reg_mock_1',
      title: 'Premium Protein & Supplement Stack - Sanuth\'s Nutrition',
      creatorName: 'Sanuth',
      creatorEmail: 'sanuthnewmin@gmail.com',
      type: 'Home Gym Project',
      description: 'Building my ultimate supplement stack! Any contribution to whey protein, creatine, or BCAAs is massively appreciated.',
      date: '2026-06-03',
      items: [
        { productId: 'p_1', wanted: 2, received: 1 },
        { productId: 'p_2', wanted: 1, received: 0 },
        { productId: 'p_6', wanted: 4, received: 2 }
      ]
    },
    {
      id: 'reg_mock_2',
      title: 'Elite Athlete Supplement Launch List',
      creatorName: 'Coach Marcus Steel',
      creatorEmail: 'marcus@elitenutrition.com',
      type: 'Commercial Fitness Studio',
      description: 'Equipping our training facility with premium proteins! Help us stock top-tier whey isolates, EAAs, and pre-workouts.',
      date: '2026-05-15',
      items: [
        { productId: 'p_4', wanted: 3, received: 1 },
        { productId: 'p_5', wanted: 6, received: 3 }
      ]
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeRegistry, setActiveRegistry] = useState<Registry | null>(null);

  // Form states
  const [regTitle, setRegTitle] = useState('');
  const [regDescription, setRegDescription] = useState('');
  const [regType, setRegType] = useState<'Home Gym Project' | 'Commercial Fitness Studio' | 'Weight Loss Goal' | 'Strength Mastery Dream'>('Weight Loss Goal');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreateRegistrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regTitle) return;

    const newRegistry: Registry = {
      id: 'reg_' + Date.now().toString(),
      title: regTitle,
      creatorName: currentUser ? currentUser.name : 'Nutrition Partner',
      creatorEmail: currentUser ? currentUser.email : 'guest@vyta.com',
      type: regType,
      description: regDescription,
      date: new Date().toISOString().split('T')[0],
      items: selectedProductIds.map(pid => ({
        productId: pid,
        wanted: 1,
        received: 0
      }))
    };

    setRegistries([newRegistry, ...registries]);
    setSuccessMsg('Registry successfully configured!');
    setTimeout(() => {
      setSuccessMsg('');
      setShowCreateModal(false);
      setRegTitle('');
      setRegDescription('');
      setSelectedProductIds([]);
    }, 1200);
  };

  const handleSendGift = (registryId: string, productId: string) => {
    setRegistries(prevRegs => 
      prevRegs.map(r => {
        if (r.id !== registryId) return r;
        return {
          ...r,
          items: r.items.map(item => {
            if (item.productId !== productId) return item;
            // Prevent overflowing wanted count if we want, but letting them exceed is fine as a demo!
            return { ...item, received: item.received + 1 };
          })
        };
      })
    );

    // Update active view as well if currently opened
    if (activeRegistry && activeRegistry.id === registryId) {
      setActiveRegistry(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(item => {
            if (item.productId !== productId) return item;
            return { ...item, received: item.received + 1 };
          })
        };
      });
    }

    // Direct contribution - simulated cart addition
    const targetProduct = products.find(p => p.id === productId);
    if (targetProduct) {
      onAddToCart(targetProduct, 1);
    }
  };

  return (
    <div className="bg-[#f7f7f7] text-gray-850 py-8" id="registry-page-root">
      
      {/* Registry Title Header */}
      <div className="bg-white border-b border-gray-200 py-6 mb-8 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 text-left">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#1c3d52] bg-[#1c3d52]/10 px-3 py-1 rounded-full border border-[#1c3d52]/20">
            Gift & Gifting Suite
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2 font-display" id="registry-header-title">
            VYTA Registry & Lists
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-normal font-sans">
            Whether you are building your personal supplement stack, outfitting a team nutrition program, or sharing wellness goals with friends, let us assemble the best selection of premium sports nutrition for you.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 space-y-12">
        
        {/* Inspiration Section */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 text-left shadow-sm space-y-6" id="registry-inspiration-section">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-150 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 font-display">Inspiration for your nutrition journey</h2>
              <p className="text-xs text-gray-500">Get guidelines on setting up equipment or exploring professional models.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (registries.length > 0) setActiveRegistry(registries[0]);
                  // Scroll down to active inspection
                  setTimeout(() => {
                    document.getElementById('active-registry-explorer')?.scrollIntoView({ behavior: 'smooth' });
                  }, 205);
                }}
                className="px-4 py-2 border border-[#1c3d52] text-[#1c3d52] hover:bg-[#1c3d52]/10 text-xs font-bold rounded transition cursor-pointer"
                id="registry-find-btn"
              >
                Find sample registries
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-[#1b73b3] hover:bg-[#145a8a] text-black text-xs font-black rounded shadow transition cursor-pointer"
                id="registry-create-btn"
              >
                Create your registry +
              </button>
            </div>
          </div>

          {/* Three Prominent Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {REGISTRY_INSPIRATIONS.map((insp) => (
              <div 
                key={insp.id}
                className="bg-[#fcfdfd] hover:bg-white rounded-lg border border-gray-180 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="h-40 bg-gray-50 relative">
                  <img
                    src={insp.image}
                    alt={insp.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-[#132836] text-amber-100 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                    {insp.type}
                  </div>
                </div>
                <div className="p-4 text-left">
                  <h3 className="text-xs font-extrabold text-gray-900 leading-snug font-display mb-1">
                    {insp.title}
                  </h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-light">
                    {insp.description}
                  </p>
                </div>
                <div className="px-4 pb-4">
                  <button
                    onClick={() => {
                      // Autocreate registry with these templates description for fast demo
                      const quickReg: Registry = {
                        id: 'insp_' + insp.id,
                        title: `Official Catalog: ${insp.title} Template`,
                        creatorName: 'VYTA Head Coach',
                        creatorEmail: 'coach@vyta.com',
                        type: insp.type as any,
                        description: insp.description,
                        date: '2026-06-03',
                        items: [
                          { productId: 'p_1', wanted: 3, received: 0 },
                          { productId: 'p_5', wanted: 2, received: 0 }
                        ]
                      };
                      setRegistries([quickReg, ...registries]);
                      setActiveRegistry(quickReg);
                      setTimeout(() => {
                        document.getElementById('active-registry-explorer')?.scrollIntoView({ behavior: 'smooth' });
                      }, 205);
                    }}
                    className="w-full text-center py-1.5 bg-gray-100 hover:bg-gray-205 text-gray-750 text-[10px] font-bold rounded transition cursor-pointer"
                  >
                    Load list template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reasons to Register with VYTA Section */}
        <div className="text-left space-y-4" id="registry-benefits-section">
          <h2 className="text-base font-bold text-gray-900 font-display uppercase tracking-wide border-b border-gray-150 pb-1.5">
            Reasons to register with VYTA
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-white rounded-lg border border-gray-200 p-5 flex items-start gap-4">
              <div className="bg-[#1c3d52]/10 rounded-lg p-2 shrink-0">
                <Globe className="h-6 w-6 text-[#1c3d52]" />
              </div>
              <div className="leading-snug">
                <h4 className="font-extrabold text-xs text-gray-950">Premium supplement selection</h4>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  Combine whey isolates, creatine, BCAAs, and pre-workouts from multiple supplement brands in one seamless wedding or team list.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 flex items-start gap-4">
              <div className="bg-[#1c3d52]/10 rounded-lg p-2 shrink-0">
                <Gift className="h-6 w-6 text-[#1c3d52]" />
              </div>
              <div className="leading-snug">
                <h4 className="font-extrabold text-xs text-gray-950">Seamlessly easy to share</h4>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  Generate customized shareable links. Friends and teammates can contribute partial or absolute gifts directly through standard checkout.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 flex items-start gap-4">
              <div className="bg-[#1c3d52]/10 rounded-lg p-2 shrink-0">
                <RefreshCcw className="h-6 w-6 text-[#1c3d52]" />
              </div>
              <div className="leading-snug">
                <h4 className="font-extrabold text-xs text-gray-950">Extended 90-Day athlete returns</h4>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  Need weights in another sizing? Enjoy a premium 90-day extended returns window with zero shipping freight surcharges for registered lists.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Active Registry Explorer Drawer list */}
        <div id="active-registry-explorer" className="bg-white rounded-lg border border-gray-200 p-6 text-left shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wide">
            <ListChecks className="h-5 w-5 text-[#1c3d52]" />
            Active Demonstration Registries ({registries.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registries.map((r, index) => (
              <div 
                key={index}
                onClick={() => setActiveRegistry(r)}
                className={`p-4 rounded-lg border transition duration-150 cursor-pointer text-left flex flex-col justify-between ${
                  activeRegistry?.id === r.id 
                    ? 'border-[#1c3d52] bg-[#1c3d52]/5 shadow-xs' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] bg-[#132836] hover:bg-[#132836] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      {r.type}
                    </span>
                    <span className="text-[10px] text-gray-400">Created: {r.date}</span>
                  </div>
                  <h3 className="font-bold text-xs text-gray-900 font-display line-clamp-1">{r.title}</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-light">By: <strong className="text-gray-800">{r.creatorName}</strong> ({r.creatorEmail})</p>
                  <p className="text-[11px] text-gray-600 mt-1.5 line-clamp-2 leading-relaxed italic text-left">
                    "{r.description}"
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-gray-150 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Includes {r.items.length} items to contribute</span>
                  <span className="text-[#1c3d52] font-bold hover:underline">Explore Details & Gift →</span>
                </div>
              </div>
            ))}
          </div>

          {/* Opened Registry Details */}
          {activeRegistry && (
            <div className="mt-6 border-t border-gray-200 pt-6 animate-in fade-in duration-200 text-left space-y-5" id="registry-focus-details">
              <div className="bg-[#1c3d52]/5 rounded-lg p-5 border border-[#1c3d52]/15 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <span className="text-[10px] text-[#1c3d52] bg-[#1c3d52]/10 font-bold px-2 py-0.5 rounded">Opened View</span>
                  <h3 className="text-base font-extrabold text-gray-900 font-display mt-1">{activeRegistry.title}</h3>
                  <p className="text-xs text-gray-500 font-light mt-0.5">
                    Managing Host: <strong className="text-gray-800">{activeRegistry.creatorName}</strong> — contact email: <span className="underline">{activeRegistry.creatorEmail}</span>
                  </p>
                  <p className="text-xs text-gray-600 mt-2 italic flex-1 max-w-2xl leading-relaxed">
                    "{activeRegistry.description}"
                  </p>
                </div>
                <button
                  onClick={() => setActiveRegistry(null)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-bold rounded transition cursor-pointer"
                >
                  Close Registry Viewer
                </button>
              </div>

              {/* Items grid for gifting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeRegistry.items.map((item, idx) => {
                  const prod = products.find(p => p.id === item.productId);
                  if (!prod) return null;

                  const fulfilledPercent = Math.min(100, Math.round((item.received / item.wanted) * 100));

                  return (
                    <div key={idx} className="bg-[#fcfdfd] border border-gray-200 rounded-lg p-4 flex gap-4 items-center justify-between">
                      <div className="flex gap-3 items-center">
                        <img
                          src={prod.image}
                          alt={prod.title}
                          referrerPolicy="no-referrer"
                          className="h-16 w-16 rounded object-cover border border-gray-200 shrink-0"
                        />
                        <div className="leading-snug text-left">
                          <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{prod.title}</h4>
                          <span className="text-[10px] text-gray-500 block mt-0.5">{prod.vendorName} | ${prod.price.toFixed(2)}</span>
                          
                          {/* Live progression metrics */}
                          <div className="mt-2 text-[10px] space-y-1">
                            <div className="flex justify-between font-bold">
                              <span className="text-gray-600">Wanted: {item.wanted}</span>
                              <span className="text-[#1c3d52]">Received: {item.received}</span>
                            </div>
                            <div className="w-28 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-[#1c3d52] h-full transition-all" style={{ width: `${fulfilledPercent}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Gift contributions */}
                      <button
                        onClick={() => handleSendGift(activeRegistry.id, item.productId)}
                        className={`px-3 py-2 text-xs font-semibold rounded transition flex items-center gap-1 shrink-0 ${
                          item.received >= item.wanted 
                            ? 'bg-[#1c3d52]/20 text-[#132836] font-bold' 
                            : 'bg-[#1b73b3] hover:bg-[#145a8a] text-black cursor-pointer shadow-xs font-extrabold'
                        }`}
                      >
                        {item.received >= item.wanted ? <Check className="h-3.5 w-3.5" /> : null}
                        <span>{item.received >= item.wanted ? 'Fulfilled - Resend' : 'Contribute / Gift'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Create Your Custom Registry Modal panel */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden text-gray-800 animate-in zoom-in-95 duration-150">
              <div className="bg-[#132836] text-white px-5 py-3.5 font-bold flex justify-between items-center">
                <span className="font-display text-sm tracking-tight">Register your Supplement List</span>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-white hover:text-[#1b73b3] text-xl font-bold p-1"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateRegistrySubmit} className="p-5 text-left space-y-4">
                {successMsg && (
                  <div className="bg-[#1c3d52]/10 text-[#132836] text-xs p-2.5 rounded border border-[#1c3d52] font-bold flex items-center gap-1.5">
                    <Check className="h-4.5 w-4.5 text-[#1c3d52]" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1">
                    List or Registry Title
                  </label>
                  <input
                    type="text"
                    required
                    value={regTitle}
                    onChange={(e) => setRegTitle(e.target.value)}
                    placeholder="e.g. Sanuth's Ultimate Protein Stack"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-xs outline-none focus:border-[#1c3d52]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1">
                    Describe your training objectives
                  </label>
                  <textarea
                    value={regDescription}
                    onChange={(e) => setRegDescription(e.target.value)}
                    placeholder="What goals are you trying to accomplish? (e.g. Preparing for LKR weightlift championships, setting studio...)"
                    rows={2}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-xs outline-none focus:border-[#1c3d52]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-1">
                      Objective Type
                    </label>
                    <select
                      value={regType}
                      onChange={(e) => setRegType(e.target.value as any)}
                      className="w-full border border-gray-300 rounded px-2 py-2 text-xs bg-gray-50 outline-none"
                    >
                      <option value="Home Gym Project">Home Gym Project</option>
                      <option value="Commercial Fitness Studio">Commercial Fitness Studio</option>
                      <option value="Weight Loss Goal">Weight Loss Goal</option>
                      <option value="Strength Mastery Dream">Strength Mastery Dream</option>
                    </select>
                  </div>
                  <div className="leading-snug select-none flex flex-col justify-end">
                    <span className="text-[10px] text-gray-400 block mb-1">Registered Creator:</span>
                    <span className="text-xs font-semibold text-gray-800 truncate">
                      {currentUser ? currentUser.name : 'Guest Nutrition Enthusiast'}
                    </span>
                  </div>
                </div>

                {/* Select initial items to register */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5">
                    Select Products to include (Pick multiple):
                  </label>
                  <div className="max-h-36 overflow-y-auto border border-gray-200 rounded p-2 space-y-1.5 bg-gray-50">
                    {products.map((p) => {
                      const isSel = selectedProductIds.includes(p.id);
                      return (
                        <div 
                          key={p.id}
                          onClick={() => toggleSelectProduct(p.id)}
                          className={`flex items-center gap-2 p-1.5 rounded text-xs select-none cursor-pointer transition ${
                            isSel ? 'bg-[#1c3d52]/15 border-[#1c3d52]' : 'hover:bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSel}
                            readOnly
                            className="text-[#1c3d52] h-3.5 w-3.5 focus:ring-[#1c3d52] rounded border-gray-300"
                          />
                          <span className="truncate flex-1 max-w-[300px]">{p.title}</span>
                          <span className="text-[10px] font-bold text-gray-400 font-mono shrink-0">${p.price.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1b73b3] hover:bg-[#145a8a] text-black font-extrabold text-xs rounded shadow transition cursor-pointer"
                  >
                    Establish Registry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
