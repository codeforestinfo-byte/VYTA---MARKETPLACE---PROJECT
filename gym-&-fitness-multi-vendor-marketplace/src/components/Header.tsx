import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Menu, User, Search, X } from 'lucide-react';
import { User as UserType } from '../types';

interface HeaderProps {
  currentUser: UserType | null;
  onSignOut: () => void;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenAuth: (tab: 'login' | 'register') => void;
  searchQuery: string;
  onSetSearchQuery: (query: string) => void;
  selectedCategory: string;
  onSetSelectedCategory: (category: string) => void;
  cartItemsCount: number;
  onOpenRegistry: () => void;
  onOpenDashboard: () => void;
  onOpenAllSidebar: () => void;
  setDeliveryRegion: (region: string) => void;
  deliveryRegion: string;
  onGoHome: () => void;
}

export default function Header({
  currentUser,
  onSignOut,
  onOpenCart,
  onOpenOrders,
  onOpenAuth,
  searchQuery,
  onSetSearchQuery,
  selectedCategory,
  onSetSelectedCategory,
  cartItemsCount,
  onOpenRegistry,
  onOpenDashboard,
  onOpenAllSidebar,
  setDeliveryRegion,
  deliveryRegion,
  onGoHome,
}: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        onSetSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, onSetSearchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
  };

  const navLinks = [
    { label: 'Whey Protein', category: 'Whey Protein' },
    { label: 'Plant Protein', category: 'Plant Protein' },
    { label: 'Creatine', category: 'Creatine' },
    { label: 'BCAAs', category: 'BCAAs & Aminos' },
    { label: 'Pre-Workout', category: 'Pre-Workout' },
    { label: 'Mass Gainers', category: 'Mass Gainers' },
    { label: 'Recovery', category: 'Recovery' },
  ];

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Top Bar */}
      <div className="bg-[#132836] text-white px-4 py-2 flex items-center justify-between gap-4">
        {/* Logo + Mobile Menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAllSidebar}
            className="lg:hidden p-1.5 hover:bg-white/10 rounded transition cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div onClick={onGoHome} className="flex items-center cursor-pointer select-none">
            <img src="/logo.png" alt="Vyta" className="h-8 w-auto" />
          </div>
        </div>

        {/* Spacer to keep layout balanced */}
        <div className="flex-1" />

        {/* Search Overlay */}
        {searchOpen && (
          <div className="absolute inset-0 bg-[#132836] flex items-center px-4 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center max-w-2xl mx-auto">
              <Search className="h-4 w-4 text-white/50 mr-3 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSetSearchQuery(e.target.value)}
                placeholder="Search proteins, creatine, BCAAs, pre-workout..."
                className="flex-1 bg-transparent text-white placeholder-white/40 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => onSetSearchQuery('')}
                className="p-1 text-white/40 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => { setSearchOpen(false); onSetSearchQuery(''); }}
                className="ml-3 text-xs text-white/60 hover:text-white transition cursor-pointer font-medium"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Search Toggle */}
          <button
            onClick={() => setSearchOpen(true)}
            className="p-1.5 hover:bg-white/10 rounded transition cursor-pointer"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Account */}
          <div className="relative group">
            <button
              onClick={() => currentUser ? null : onOpenAuth('login')}
              className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded transition cursor-pointer text-left"
            >
              <User className="h-4 w-4 text-[#1b73b3]" />
              <div className="hidden md:block text-xs">
                <span className="text-white/70 block leading-tight">{currentUser ? 'Hi,' : 'Sign In'}</span>
                <span className="text-white font-semibold block leading-tight">{currentUser?.name || 'Account'}</span>
              </div>
            </button>
            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-xl border border-gray-100 text-gray-700 text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 overflow-hidden">
              {!currentUser ? (
                <div className="p-3">
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="w-full py-1.5 bg-[#132836] text-white font-semibold rounded"
                  >
                    Sign In
                  </button>
                  <p className="text-center mt-1.5 text-gray-500">
                    New user?{' '}
                    <span onClick={() => onOpenAuth('register')} className="text-[#132836] hover:underline cursor-pointer font-medium">
                      Start here
                    </span>
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">{currentUser.name}</p>
                    <span className="text-[10px] text-gray-400 capitalize">{currentUser.role}</span>
                  </div>
                  <button onClick={() => { onOpenOrders(); }} className="w-full text-left px-3 py-1.5 hover:bg-gray-50">Orders</button>
                  <button onClick={() => { onOpenRegistry(); }} className="w-full text-left px-3 py-1.5 hover:bg-gray-50">Registries</button>
                  {currentUser.role === 'vendor' && (
                    <button onClick={() => { onOpenDashboard(); }} className="w-full text-left px-3 py-1.5 hover:bg-gray-50 font-semibold text-[#132836]">Vendor Dashboard</button>
                  )}
                  <button onClick={onSignOut} className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 border-t border-gray-100">Sign Out</button>
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          <button
            onClick={onOpenCart}
            className="relative p-1.5 hover:bg-white/10 rounded transition cursor-pointer"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#1b73b3] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-[black] text-white px-4 py-1.5 flex items-center gap-4 text-xs font-medium overflow-x-auto whitespace-nowrap">
        <button
          onClick={onOpenAllSidebar}
          className="hidden lg:flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded transition cursor-pointer font-semibold"
        >
          <Menu className="h-4 w-4" />
          Categories
        </button>
        <div className="flex items-center gap-3">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => {
                onSetSelectedCategory(link.category);
                onGoHome();
              }}
              className={`px-2 py-1 hover:bg-white/10 rounded transition cursor-pointer ${
                selectedCategory === link.category ? 'text-[#1b73b3] font-semibold' : 'text-white/80 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
          <span
            onClick={onOpenRegistry}
            className="px-2 py-1 text-[#1b73b3] font-semibold hover:bg-white/10 rounded transition cursor-pointer"
          >
            Registries
          </span>
        </div>
      </div>
    </header>
  );
}
