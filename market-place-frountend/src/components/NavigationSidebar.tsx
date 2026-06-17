import React from 'react';
import { X, User as UserIcon, Dumbbell, Trophy, Heart, HelpCircle, Flame, Sparkles } from 'lucide-react';
import { User } from '../types';

interface NavigationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onOpenAuth: (tab: 'login' | 'register') => void;
  onSetSelectedCategory: (category: string) => void;
  onOpenOrders: () => void;
  onOpenRegistry: () => void;
  onSignOut: () => void;
  onGoHome: () => void;
}

export default function NavigationSidebar({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  onSetSelectedCategory,
  onOpenOrders,
  onOpenRegistry,
  onSignOut,
  onGoHome,
}: NavigationSidebarProps) {
  if (!isOpen) return null;

  const categories = [
    'Whey Protein',
    'Plant Protein',
    'Creatine',
    'BCAAs & Aminos',
    'Pre-Workout',
    'Mass Gainers',
    'Recovery',
  ];

  return (
    <div className="fixed inset-0 z-50 flex" id="left-sidebar-overlay">
      {/* Background Mask */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 transition-opacity"
        id="left-sidebar-backdrop"
      />

      {/* Drawer Body */}
      <div 
        className="relative flex w-full max-w-xs flex-col bg-white text-gray-850 shadow-2xl h-full overflow-y-auto animate-in slide-in-from-left duration-200"
        id="left-sidebar-panel"
      >
        {/* Sliding Header with User Greeting */}
        <div className="bg-[#132836] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#1c3d52] rounded-full">
              <UserIcon className="h-5 w-5 text-white" />
            </div>
            {currentUser ? (
              <div className="leading-tight text-left">
                <p className="text-[11px] text-teal-200">Hello,</p>
                <p className="text-sm font-bold truncate max-w-[170px]" id="sidebar-user-name">
                  {currentUser.name}
                </p>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth('login');
                  onClose();
                }}
                className="text-sm font-bold text-white hover:underline transition cursor-pointer"
                id="sidebar-signin-button"
              >
                Hello, sign in
              </button>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-[#1b73b3] transition duration-150 p-1 rounded-full cursor-pointer"
            aria-label="Close Left Sidebar"
            id="sidebar-close-button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Categories / Links */}
        <div className="p-5 flex-1 divide-y divide-gray-100 flex flex-col gap-4 text-xs select-none">
          
          {/* Section: Trending / Highlights */}
          <div className="pb-3 flex flex-col gap-2">
            <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-1">
              <Flame className="h-4 w-4 text-[#1b73b3] fill-[#1b73b3]" />
              Trending Nutrition Topics
            </h4>
            <button
               onClick={() => {
                onSetSelectedCategory('All Departments');
                onGoHome();
                onClose();
              }}
              className="text-left py-1.5 px-2 hover:bg-gray-50 rounded text-gray-700 hover:text-[#132836] transition"
            >
              Today's Hot Deals
            </button>
            <button
              onClick={() => {
                onOpenRegistry();
                onClose();
              }}
              className="text-left py-1.5 px-2 hover:bg-gray-50 rounded text-gray-700 hover:text-[#132836] transition flex items-center gap-1"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#1b73b3]" />
              Active Supplement Registries
            </button>
          </div>

          {/* Section: Shop By Department */}
          <div className="py-3 flex flex-col gap-2">
            <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-1 text-left">
              <Dumbbell className="h-4 w-4 text-[#1c3d52]" />
              Shop Supplement Categories
            </h4>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  onSetSelectedCategory(cat);
                  onGoHome();
                  onClose();
                }}
                className="text-left py-2 px-2 hover:bg-gray-50 rounded text-gray-700 hover:text-[#1b73b3] font-normal transition"
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Section: Programs & Settings */}
          <div className="py-3 flex flex-col gap-2">
            <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-1 text-left">
              <Trophy className="h-4 w-4 text-yellow-600" />
              Programs & Features
            </h4>
            <button
              onClick={() => {
                onOpenOrders();
                onClose();
              }}
              className="text-left py-1.5 px-2 hover:bg-gray-50 rounded text-gray-700 hover:text-[#132836] transition"
            >
              Your Active Orders
            </button>
            {currentUser && currentUser.role === 'vendor' && (
              <p className="text-[10px] text-amber-800 bg-amber-50 rounded px-2 py-1 select-none font-medium">
                You are registered as a merchant seller with access to inventory dashboards.
              </p>
            )}
          </div>

          {/* Section: Help & Account Support */}
          <div className="py-3 flex flex-col gap-2">
            <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-1 text-left">
              <HelpCircle className="h-4 w-4 text-indigo-600" />
              Help & Settings
            </h4>
            <button
              onClick={() => {
                onOpenAuth('login');
                onClose();
              }}
              className="text-left py-1.5 px-2 hover:bg-gray-50 rounded text-gray-700 hover:text-[#132836] transition"
            >
              Manage Account & Lists
            </button>
            {currentUser ? (
              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="text-left py-1.5 px-2 hover:bg-red-50 text-red-600 font-bold rounded transition mt-1"
              >
                Sign Out Of VYTA
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
