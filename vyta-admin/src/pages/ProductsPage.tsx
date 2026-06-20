import { useState } from 'react';
import Header from '../components/Header';
import SubHeader from '../components/SubHeader';
import { Package } from 'lucide-react';
import type { RegionConfig, AccountConfig } from '../types';
import { REGIONS, ACCOUNTS } from '../data';

export default function ProductsPage() {
  const [activeRegion] = useState<RegionConfig>(REGIONS[0]);
  const [activeAccount] = useState<AccountConfig>(ACCOUNTS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-aws-body-bg flex flex-col font-sans antialiased overflow-hidden">
      <Header
        activeAccount={activeAccount}
        setActiveAccount={() => {}}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenExplorer={() => {}}
      />
      <SubHeader isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 rounded bg-white border border-aws-border flex items-center justify-center">
              <Package size={16} className="text-aws-blue-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-aws-heading">Products</h1>
              <p className="text-sm text-aws-text-secondary mt-0.5">Browse and manage all products listed on the marketplace</p>
            </div>
          </div>
          <div className="bg-white border border-aws-border rounded p-6">
            <p className="text-aws-text-secondary">Product management interface coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
