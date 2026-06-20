import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, X, Columns, ArrowLeftRight, Archive, EyeOff, HelpCircle } from 'lucide-react';
import { Widget } from '../types';

interface WidgetCardProps {
  key?: string | number | null;
  widget: Widget;
  onRemove: () => void;
  onResize: (newSize: 'narrow' | 'medium' | 'wide' | 'extra-wide') => void;
  onMoveLeft?: (() => void) | undefined;
  onMoveRight?: (() => void) | undefined;
  children: React.ReactNode;
  dragOver: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

export default function WidgetCard({
  widget,
  onRemove,
  onResize,
  onMoveLeft,
  onMoveRight,
  children,
  dragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop
}: WidgetCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close options menu if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine span classes based on custom enterprise grid sizes
  const getColSpan = (size: string) => {
    switch (size) {
      case 'narrow':
        return 'col-span-12 md:col-span-6 lg:col-span-3 xl:col-span-3';
      case 'medium':
        return 'col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3.5';
      case 'wide':
        return 'col-span-12 lg:col-span-6 xl:col-span-5';
      case 'extra-wide':
        return 'col-span-12 lg:col-span-8 xl:col-span-7';
      default:
        return 'col-span-12 md:col-span-6';
    }
  };

  const cycleSize = () => {
    const sizes: ('narrow' | 'medium' | 'wide' | 'extra-wide')[] = ['narrow', 'medium', 'wide', 'extra-wide'];
    const currentIndex = sizes.indexOf(widget.size);
    const nextSize = sizes[(currentIndex + 1) % sizes.length];
    onResize(nextSize);
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      className={`bg-white border rounded-[2px] shadow-sm  transition-all duration-200 relative flex flex-col ${
        getColSpan(widget.size)
      } ${
        dragOver ? 'border-aws-orange-accent ring-2 ring-aws-orange-accent/20 bg-orange-50/10 scale-[1.01]' : 'border-aws-border hover:border-gray-300'
      } ${collapsed ? 'h-auto' : 'min-h-[290px]'}`}
      id={`widget-card-${widget.id}`}
    >
      {/* Header section of the widget card */}
      <div className="flex items-center justify-between border-b border-aws-border px-3 py-2 bg-gray-50/50">
        
        {/* Left: Drag Handle and Title */}
        <div className="flex items-center space-x-2">
          {/* Custom 2x3 Grip Dot Handle */}
          <div
            className="flex flex-col space-y-[2px] pr-1 drag-handle opacity-40 hover:opacity-100 transition-opacity duration-200"
            title="Drag to rearrange"
          >
            <div className="grid grid-cols-2 gap-[2px]">
              <span className="w-1 h-1 rounded-full bg-gray-500"></span>
              <span className="w-1 h-1 rounded-full bg-gray-500"></span>
              <span className="w-1 h-1 rounded-full bg-gray-500"></span>
              <span className="w-1 h-1 rounded-full bg-gray-500"></span>
              <span className="w-1 h-1 rounded-full bg-gray-500"></span>
              <span className="w-1 h-1 rounded-full bg-gray-500"></span>
            </div>
          </div>

          {/* Widget Title */}
          <h2 className="font-semibold text-[14px] text-aws-heading tracking-tight flex items-center space-x-2">
            <span>{widget.title}</span>
            {widget.infoText && (
              <span
                className="inline-flex text-[#0066cc] cursor-pointer hover:underline text-[10px] font-medium ml-1"
                title={widget.infoText}
              >
                Info
              </span>
            )}
          </h2>
        </div>

        {/* Right: Actions menu trigger */}
        <div className="flex items-center space-x-1" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-500 hover:text-aws-heading transition-all duration-200 focus:outline-none"
            title="Widget options"
          >
            <MoreVertical size={14} />
          </button>

          {/* Hoverable close shortcut */}
          <button
            onClick={onRemove}
            className="p-1 hover:bg-red-50 hover:text-[#ef4444] rounded text-gray-400 hover:scale-105 transition-all duration-150"
            title="Remove widget"
          >
            <X size={14} />
          </button>

          {/* Widget drop menu */}
          {menuOpen && (
            <div className="absolute right-2 top-9 w-48 bg-white border border-aws-border shadow-md rounded-[2.5px] py-1 z-35 text-[12px] text-aws-heading text-left">
              <div className="px-3 py-1 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-aws-border">
                Widget Controls
              </div>
              
              {/* Positions shifting */}
              <div className="flex border-b border-aws-border">
                <button
                  type="button"
                  onClick={() => {
                    onMoveLeft && onMoveLeft();
                    setMenuOpen(false);
                  }}
                  disabled={!onMoveLeft}
                  className="flex-1 text-center py-2 px-1 hover:bg-gray-100 border-r border-aws-border text-[11px] font-medium text-gray-700 disabled:opacity-40"
                >
                  ◀ Move Up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onMoveRight && onMoveRight();
                    setMenuOpen(false);
                  }}
                  disabled={!onMoveRight}
                  className="flex-1 text-center py-2 px-1 hover:bg-gray-100 text-[11px] font-medium text-gray-700 disabled:opacity-40"
                >
                  Move Down ▶
                </button>
              </div>

              {/* Sizes changer */}
              <div className="px-3 py-1 bg-gray-50/50 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Size
              </div>
              <button
                type="button"
                onClick={() => { onResize('narrow'); setMenuOpen(false); }}
                className={`flex items-center justify-between w-full px-3 py-1.5 hover:bg-gray-100 ${widget.size === 'narrow' ? 'font-bold text-aws-blue-accent' : ''}`}
              >
                <span>Narrow (25%)</span>
                <Columns size={12} className="text-gray-400" />
              </button>
              <button
                type="button"
                onClick={() => { onResize('medium'); setMenuOpen(false); }}
                className={`flex items-center justify-between w-full px-3 py-1.5 hover:bg-gray-100 ${widget.size === 'medium' ? 'font-bold text-aws-blue-accent' : ''}`}
              >
                <span>Medium (33%)</span>
                <Columns size={12} className="text-gray-400" />
              </button>
              <button
                type="button"
                onClick={() => { onResize('wide'); setMenuOpen(false); }}
                className={`flex items-center justify-between w-full px-3 py-1.5 hover:bg-gray-100 ${widget.size === 'wide' ? 'font-bold text-aws-blue-accent' : ''}`}
              >
                <span>Wide (50%)</span>
                <Columns size={12} className="text-gray-400" />
              </button>
              <button
                type="button"
                onClick={() => { onResize('extra-wide'); setMenuOpen(false); }}
                className={`flex items-center justify-between w-full px-3 py-1.5 hover:bg-gray-100 ${widget.size === 'extra-wide' ? 'font-bold text-aws-blue-accent' : ''}`}
              >
                <span>Extra Wide (66%)</span>
                <Columns size={12} className="text-gray-400" />
              </button>

              <div className="border-t border-aws-border mt-1">
                <button
                  type="button"
                  onClick={() => { setCollapsed(!collapsed); setMenuOpen(false); }}
                  className="flex items-center space-x-2 w-full text-left px-3 py-2 hover:bg-gray-100"
                >
                  <Columns size={12} className="text-gray-500 shrink-0" />
                  <span>{collapsed ? 'Expand Content' : 'Minimize Content'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onRemove(); setMenuOpen(false); }}
                  className="flex items-center space-x-2 w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600 font-medium"
                >
                  <Archive size={12} className="text-red-400 shrink-0" />
                  <span>Close Widget</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Widget Content Body */}
      {!collapsed && (
        <div className="p-4 flex-1 flex flex-col relative bg-white overflow-hidden text-[13px] text-aws-text-secondary select-text">
          {children}
        </div>
      )}

      {/* Bottom Option indicator + Diagonal corner resize indicator handle */}
      {!collapsed && (
        <div
          onClick={cycleSize}
          className="absolute bottom-1 right-1 w-3.5 h-3.5 cursor-se-resize flex items-end justify-end group focus:outline-none"
          title={`Click to cycle card width (current: ${widget.size})`}
        >
          {/* Custom vector diagonal ribbed lines */}
          <svg className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500 transition-colors duration-150" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="8" y1="5" x2="5" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
      )}
    </div>
  );
}
