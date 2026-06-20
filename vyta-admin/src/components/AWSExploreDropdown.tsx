import React, { useState } from 'react';
import { X, Search, Shield, Server, Database, Cloud, Network, Briefcase, RefreshCw, Layers } from 'lucide-react';
import { SERVICES } from '../data';

interface AWSExploreDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectService?: (serviceName: string) => void;
}

export default function AWSExploreDropdown({
  isOpen,
  onClose,
  onSelectService
}: AWSExploreDropdownProps) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  // Group services by category
  const categories = Array.from(new Set(SERVICES.map((s) => s.category)));

  // Filter services by search query
  const filteredServices = SERVICES.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto ">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-aws-dark/50 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Main dialog box */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white w-full max-w-4xl rounded-[3px] border border-aws-border shadow-2xl flex flex-col max-h-[85vh]">
          
          {/* Header section */}
          <div className="px-5 py-3.5 bg-aws-dark text-white flex items-center justify-between border-b border-[#2d3a4b]">
            <div className="flex items-center space-x-2">
              <span className="text-aws-orange-accent">✦</span>
              <span className="font-bold text-[14px]">AWS Cloud Services Catalog</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#253344] text-gray-300 hover:text-white rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search panel inside dialog */}
          <div className="p-4 border-b border-aws-border bg-gray-50 flex items-center space-x-3">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Filter services by name, keyword, or family category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-[13px] bg-white border border-gray-300 rounded px-3 py-1.5 focus:border-aws-blue-accent focus:outline-none"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-[11px] text-gray-400 hover:text-black font-semibold uppercase"
              >
                Clear
              </button>
            )}
          </div>

          {/* Categorized list items block */}
          <div className="p-6 overflow-y-auto flex-1 bg-white">
            {filteredServices.length > 0 ? (
              <div className="space-y-6">
                {categories.map((category) => {
                  const itemsInCategory = filteredServices.filter((s) => s.category === category);
                  if (itemsInCategory.length === 0) return null;

                  return (
                    <div key={category} className="space-y-2.5">
                      <div className="text-[11px] font-extrabold text-aws-text-secondary uppercase tracking-wider border-b border-[#eaeded] pb-1 flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 bg-aws-orange-accent rounded-full inline-block"></span>
                        <span>{category}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {itemsInCategory.map((service) => (
                          <div
                            key={service.name}
                            onClick={() => {
                              onSelectService && onSelectService(service.name);
                              onClose();
                            }}
                            className="flex items-start p-2.5 hover:bg-gray-50 border border-transparent hover:border-aws-border rounded-[2px] cursor-pointer transition-all duration-150 group"
                          >
                            {/* Accent Icon badge */}
                            <div
                              className="w-8 h-8 flex items-center justify-center rounded-[3px] text-xs font-mono font-bold text-white shrink-0 mr-3 shadow-sm group-hover:scale-105 duration-200"
                              style={{ backgroundColor: service.iconBg }}
                            >
                              {service.iconText}
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-[13px] text-aws-blue-accent group-hover:underline block truncate leading-tight">
                                {service.name}
                              </span>
                              <span className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-normal">
                                {service.description}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                No services found. Try logging another keyword.
              </div>
            )}
          </div>

          {/* Catalog Footer details */}
          <div className="px-6 py-3 bg-gray-50 text-right text-[11.5px] border-t border-aws-border text-gray-500 font-medium ">
            Click any service link above to navigate or save context credentials.
          </div>
        </div>
      </div>
    </div>
  );
}
