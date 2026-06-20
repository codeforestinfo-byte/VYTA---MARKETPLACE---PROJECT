import { useState, useEffect, useRef } from 'react';
import { Search, Bell, HelpCircle, Settings, Terminal, Grid3X3, Check } from 'lucide-react';
import { AccountConfig } from '../types';
import { ACCOUNTS } from '../data';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  activeAccount: AccountConfig;
  setActiveAccount: (account: AccountConfig) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenExplorer: () => void;
}

export default function Header({
  activeAccount,
  setActiveAccount,
  searchQuery,
  setSearchQuery,
  onOpenExplorer
}: HeaderProps) {
  const { logout } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Focus search input on Option + S listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Option+S or Alt+S
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between h-12 bg-gradient-to-r from-[#0a3d7a] via-[#1153a5] to-[#1663c4] text-white px-3 border-b border-[#2d3a4b] text-[13px]">
      {/* Left: AWS Logo & Grid Icon Menu */}
      <div className="flex items-center space-x-3">
        {/* Logo */}
        <a href="#home" className="flex items-center h-8 px-1 focus:outline-none focus:ring-1 focus:ring-aws-blue-accent">
          <img src="/logo.png" alt="VYTA" className="h-7 w-auto" />
        </a>

        {/* 9-Dot services utility */}
        <button
          onClick={onOpenExplorer}
          className="flex items-center justify-center h-8 w-8 hover:bg-[#253344] active:bg-[#2e3e52] rounded text-gray-300 hover:text-white transition-colors duration-200"
          title="All Services Catalog"
        >
          <Grid3X3 size={18} />
        </button>
      </div>

      {/* Middle: Expanding Search Bar */}
      <div className="flex-1 max-w-lg mx-6 relative">
        <div
          className={`flex items-center h-[28px] bg-[#0d2647]/80 border rounded px-2 transition-all duration-200 ${
            searchFocused ? 'border-[#1153a5] shadow-[0_0_0_2px_rgba(17,83,165,0.3)] bg-[#0a1d38] text-white' : 'border-[#1f5a9e]/50 text-gray-300'
          }`}
        >
          <Search size={14} className={`mr-2 ${searchFocused ? 'text-blue-300' : 'text-gray-400'}`} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            className="w-full bg-transparent focus:outline-none text-[13px] h-full placeholder-gray-400"
          />
          {!searchFocused && (
            <span className="text-[10px] text-blue-300 border border-[#1f5a9e]/50 px-1 py-[2px] rounded ml-1 bg-[#0a1d38]">
              [Option+S]
            </span>
          )}
        </div>
      </div>

      {/* Right: Quick actions, Region dropdown, Account info dropdown */}
      <div className="flex items-center space-x-2">
        {/* Terminal / CloudShell */}
        <button className="flex items-center justify-center h-8 w-8 hover:bg-[#253344] rounded text-gray-300 hover:text-white transition-all duration-200" title="CloudShell">
          <Terminal size={16} />
        </button>

        {/* Notifications (Bell) */}
        <button className="relative flex items-center justify-center h-8 w-8 hover:bg-[#253344] rounded text-gray-300 hover:text-white transition-all duration-200" title="Notifications">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#ef4444] rounded-full"></span>
        </button>

        {/* Help */}
        <button className="flex items-center justify-center h-8 w-8 hover:bg-[#253344] rounded text-gray-300 hover:text-white transition-all duration-200" title="Help">
          <HelpCircle size={16} />
        </button>

        {/* Settings */}
        <button className="flex items-center justify-center h-8 w-8 hover:bg-[#253344] rounded text-gray-300 hover:text-white transition-all duration-200" title="Settings">
          <Settings size={16} />
        </button>

        <span className="h-4 w-px bg-gray-700 mx-1"></span>

        {/* User Account Dropdown */}
        <div ref={accountRef} className="relative">
          <button
            onClick={() => setAccountOpen(!accountOpen)}
            className={`flex items-center h-8 px-2 hover:bg-[#253344] rounded text-gray-200 hover:text-white transition-all duration-200  ${
              accountOpen ? 'bg-[#253344] text-white' : ''
            }`}
          >
            <span className="max-w-[240px] truncate mr-1 font-medium hidden md:inline">
              {activeAccount.role}/{activeAccount.name} @ {activeAccount.accountId}
            </span>
            <span className="max-w-[80px] truncate mr-1 font-medium md:hidden">
              {activeAccount.role}
            </span>
            <span className="text-[9px] text-gray-400">▼</span>
          </button>

          {accountOpen && (
            <div className="absolute right-0 mt-1 w-80 bg-white text-gray-800 rounded border border-[#eaeded] shadow-lg py-1 z-50 text-[12px]">
              <div className="px-4 py-2 border-b border-[#eaeded]">
                <div className="font-bold text-gray-900 truncate">{activeAccount.role}</div>
                <div className="text-[11px] text-gray-500 truncate">{activeAccount.email}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Account: {activeAccount.accountId}</div>
              </div>
              <div className="px-3 py-1 bg-gray-50 text-gray-400 font-medium uppercase text-[10px] border-b border-[#eaeded]">
                Switch Account
              </div>
              <ul>
                {ACCOUNTS.map((acc) => (
                  <li key={acc.accountId}>
                    <button
                      onClick={() => {
                        setActiveAccount(acc);
                        setAccountOpen(false);
                      }}
                      className="flex items-center justify-between w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150"
                    >
                      <div className="flex flex-col truncate">
                        <span className="font-medium text-gray-900">{acc.role} / {acc.name}</span>
                        <span className="text-[10px] text-gray-500">ID: {acc.accountId}</span>
                      </div>
                      {activeAccount.accountId === acc.accountId && (
                        <Check size={14} className="text-aws-blue-accent" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-[#eaeded] mt-1 pt-1 pb-1">
                <button onClick={logout} className="block w-full text-left px-4 py-1.5 text-aws-blue-accent hover:underline">
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
