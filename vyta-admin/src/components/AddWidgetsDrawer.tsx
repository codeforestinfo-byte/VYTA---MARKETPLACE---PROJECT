import React, { useState } from 'react';
import { X, Plus, Check, Trash2, RotateCcw, Layout, LayoutGrid } from 'lucide-react';
import { Widget } from '../types';

interface AddWidgetsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: Widget[];
  onToggleWidget: (id: string) => void;
  onResetLayout: () => void;
}

export default function AddWidgetsDrawer({
  isOpen,
  onClose,
  widgets,
  onToggleWidget,
  onResetLayout
}: AddWidgetsDrawerProps) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredWidgets = widgets.filter(w =>
    w.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden ">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white border-l border-aws-border shadow-2xl flex flex-col h-full">
          
          {/* Header */}
          <div className="px-4 py-4 bg-gray-50 border-b border-aws-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <LayoutGrid size={18} className="text-aws-blue-accent" />
              <h2 className="text-[15px] font-bold text-aws-heading">
                Customize Console Home
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-black transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search filter */}
          <div className="p-4 border-b border-aws-border bg-white shadow-sm">
            <input
              type="text"
              placeholder="Search available widgets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-[13px] px-3 py-1.5 bg-gray-50 border border-gray-300 rounded focus:border-aws-blue-accent focus:bg-white focus:outline-none"
            />
          </div>

          {/* Widgets List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-aws-body-bg/40">
            {filteredWidgets.length > 0 ? (
              filteredWidgets.map((widget) => (
                <div
                  key={widget.id}
                  className={`border p-3.5 bg-white rounded shadow-sm flex items-start justify-between transition-all duration-200 ${
                    widget.visible ? 'border-aws-blue-accent/30 bg-blue-50/10' : 'border-aws-border'
                  }`}
                >
                  <div className="space-y-1 pr-4">
                    <div className="font-bold text-[13.5px] text-aws-heading flex items-center space-x-2">
                      <span>{widget.title}</span>
                      {widget.visible && (
                        <span className="text-[9px] bg-blue-100 text-aws-blue-accent px-1.5 py-0.2 rounded font-semibold uppercase">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-gray-500 leading-normal">
                      Configure layout, size ({widget.size.toUpperCase()}), and dynamic regional data backplanes on the workspace canvas.
                    </p>
                  </div>

                  {/* Add / Remove Actions */}
                  <button
                    onClick={() => onToggleWidget(widget.id)}
                    className={`shrink-0 flex items-center justify-center rounded px-3 py-1 text-[11.5px] font-bold transition-all duration-200 ${
                      widget.visible
                        ? 'bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-700 border border-gray-300'
                        : 'bg-aws-orange-accent hover:bg-aws-orange-accent-hover text-black border border-transparent'
                    }`}
                  >
                    {widget.visible ? (
                      <span className="flex items-center space-x-1">
                        <Check size={12} className="stroke-[3]" />
                        <span>Remove</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1">
                        <Plus size={12} className="stroke-[3]" />
                        <span>Add Widget</span>
                      </span>
                    )}
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400 text-[13px]">
                No widgets matching your filter.
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 bg-gray-50 border-t border-aws-border flex items-center justify-between space-x-3 text-[12px]">
            <button
              onClick={() => {
                onResetLayout();
                onClose();
              }}
              className="flex items-center space-x-1.5 text-gray-600 hover:text-black font-semibold transition-colors py-1.5 px-3 border border-gray-300 hover:border-black rounded bg-white"
            >
              <RotateCcw size={12} />
              <span>Reset Layout Grid</span>
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-aws-blue-accent hover:bg-blue-700 text-white font-bold rounded transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
