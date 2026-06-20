import React, { useState } from 'react';
import { RegionConfig } from '../types';
import { BAR_DATA, BAR_COLORS } from '../data';
import { TrendingDown, ArrowDownRight, ExternalLink } from 'lucide-react';

interface CostUsageWidgetProps {
  activeRegion: RegionConfig;
}

export default function CostUsageWidget({ activeRegion }: CostUsageWidgetProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Compute a ratio to scale the bar heights dynamically depending on the selected region's cost
  const baseCost = 125.79; // N. Virginia base cost
  const scaleRatio = activeRegion.monthlyCost / baseCost;

  // Maximum value for the y-axis
  const maxAxisValue = 300;
  const chartHeight = 150; // Inner SVG Height

  // Help calculate stacked coordinates
  const calculateSegments = (item: typeof BAR_DATA[number]) => {
    // Basic service values scaled by the active region's ratio
    const compute = item.compute * scaleRatio;
    const database = item.database * scaleRatio;
    const networking = item.networking * scaleRatio;
    const storage = item.storage * scaleRatio;
    const other = item.other * scaleRatio;

    const total = compute + database + networking + storage + other;

    return {
      compute,
      database,
      networking,
      storage,
      other,
      total
    };
  };

  return (
    <div className="flex flex-col md:flex-row h-full md:space-x-8 justify-between">
      
      {/* Left Column: Monthly Cost metrics */}
      <div className="flex-1 max-w-xs flex flex-col justify-between py-1 border-b md:border-b-0 md:border-r border-aws-border pb-4 md:pb-0 md:pr-6 mb-4 md:mb-0">
        <div className="space-y-4">
          {/* Current Month cost */}
          <div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-tight">
              Current month costs
            </div>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-bold text-aws-heading select-all">
                ${activeRegion.monthlyCost.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center text-xs text-green-700 font-medium mt-1">
              <TrendingDown size={14} className="mr-1 shrink-0" />
              <span>11% compared to last month for same period</span>
            </div>
          </div>

          {/* Forecasted end costs */}
          <div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-tight">
              Forecasted month end costs
            </div>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold text-aws-heading select-all border-b border-dashed border-gray-400">
                ${activeRegion.forecastedCost.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center text-xs text-green-700 font-medium mt-1">
              <TrendingDown size={14} className="mr-1 shrink-0" />
              <span>6% compared to last month's total costs</span>
            </div>
          </div>
        </div>

        {/* Action Button at bottom */}
        <div className="mt-6 pt-3">
          <button className="w-full text-center py-1.5 px-3 bg-white border border-[#c1c9d2] hover:border-black rounded text-[12px] font-semibold text-aws-heading hover:bg-gray-50 transition-all duration-200">
            Enable Cost Optimization Hub
          </button>
        </div>
      </div>

      {/* Right Column: Stacked bar chart */}
      <div className="flex-[2] flex flex-col justify-between  relative">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[12px] font-bold text-aws-heading">
            Cost ($)
          </div>
          {/* Static Chart Legend Indicators */}
          <div className="flex items-center space-x-2.5 text-[10px] text-gray-500 font-medium">
            <span className="flex items-center">
              <span className="w-2.5 h-1.5 mr-1" style={{ backgroundColor: BAR_COLORS.compute }}></span>
              Compute
            </span>
            <span className="flex items-center">
              <span className="w-2.5 h-1.5 mr-1" style={{ backgroundColor: BAR_COLORS.database }}></span>
              DB
            </span>
            <span className="flex items-center">
              <span className="w-2.5 h-1.5 mr-1" style={{ backgroundColor: BAR_COLORS.storage }}></span>
              Storage
            </span>
            <span className="flex items-center">
              <span className="w-2.5 h-1.5 mr-1" style={{ backgroundColor: BAR_COLORS.networking }}></span>
              Network
            </span>
          </div>
        </div>

        {/* Custom SVG Scalable Bar Chart */}
        <div className="relative w-full h-[160px]">
          <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
            {/* Horizontal Gridlines / Helper Lines */}
            {[0, 100, 200, 300].map((tick) => {
              const y = chartHeight - (tick / maxAxisValue) * chartHeight;
              return (
                <g key={tick}>
                  <line
                    x1="35"
                    y1={y}
                    x2="480"
                    y2={y}
                    stroke="#eaeaea"
                    strokeWidth="1"
                    strokeDasharray={tick === 0 ? "0" : "3 3"}
                  />
                  {/* Left Label */}
                  <text x="5" y={y + 4} className="font-mono text-[9px] fill-gray-400 font-medium">
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Bars Column Drawing */}
            {BAR_DATA.map((item, index) => {
              const segs = calculateSegments(item);
              const barWidth = 32;
              const spacing = 72; // Horizontal columns spacing
              const xStart = 50 + index * spacing;

              // Stack accumulation height offsets
              let accumulatedHeight = 0;

              // Helper to build segment attributes
              const getRectAttrs = (value: number, color: string) => {
                const height = (value / maxAxisValue) * chartHeight;
                const y = chartHeight - accumulatedHeight - height;
                accumulatedHeight += height;
                return { y, height, color };
              };

              const compRect = getRectAttrs(segs.compute, BAR_COLORS.compute);
              const dbRect = getRectAttrs(segs.database, BAR_COLORS.database);
              const storeRect = getRectAttrs(segs.storage, BAR_COLORS.storage);
              const netRect = getRectAttrs(segs.networking, BAR_COLORS.networking);
              const otherRect = getRectAttrs(segs.other, BAR_COLORS.other);

              const isHovered = hoveredBar === index;

              return (
                <g
                  key={item.month}
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                  className="cursor-pointer"
                >
                  {/* Backdrop highlight on hover column */}
                  {isHovered && (
                    <rect
                      x={xStart - 8}
                      y="1"
                      width={barWidth + 16}
                      height={chartHeight + 4}
                      fill="#f1f3f3"
                      rx="2"
                      opacity="0.6"
                    />
                  )}

                  {/* 1. Compute layer (bottom blue) */}
                  <rect
                    x={xStart}
                    y={compRect.y}
                    width={barWidth}
                    height={compRect.height}
                    fill={compRect.color}
                    className="transition-all duration-300"
                  />

                  {/* 2. Database layer (brown-red) */}
                  <rect
                    x={xStart}
                    y={dbRect.y}
                    width={barWidth}
                    height={dbRect.height}
                    fill={dbRect.color}
                    className="transition-all duration-300"
                  />

                  {/* 3. Storage layer (light blue) */}
                  <rect
                    x={xStart}
                    y={storeRect.y}
                    width={barWidth}
                    height={storeRect.height}
                    fill={storeRect.color}
                    className="transition-all duration-300"
                  />

                  {/* 4. Networking layer (orange) */}
                  <rect
                    x={xStart}
                    y={netRect.y}
                    width={barWidth}
                    height={netRect.height}
                    fill={netRect.color}
                    className="transition-all duration-300"
                  />

                  {/* 5. Others layer (top green) */}
                  <rect
                    x={xStart}
                    y={otherRect.y}
                    width={barWidth}
                    height={otherRect.height}
                    fill={otherRect.color}
                    className="transition-all duration-300"
                  />

                  {/* X-axis Label text */}
                  <text
                    x={xStart + barWidth / 2}
                    y={chartHeight + 14}
                    textAnchor="middle"
                    className={`font-semibold text-[10px] ${isHovered ? 'fill-aws-blue-accent' : 'fill-gray-500'}`}
                  >
                    {item.month}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Overlay */}
          {hoveredBar !== null && (
            <div
              className="absolute bg-aws-dark text-white text-[11px] rounded p-2 shadow-md border border-gray-700 pointer-events-none z-45"
              style={{
                left: `${65 + hoveredBar * 71}px`,
                top: '5px'
              }}
            >
              <div className="font-bold mb-1 border-b border-gray-700 pb-0.5 text-orange-400">
                {BAR_DATA[hoveredBar].month}
              </div>
              <ul className="space-y-0.5 font-mono">
                <li className="flex justify-between space-x-4">
                  <span>Compute:</span>
                  <span className="font-bold">${(BAR_DATA[hoveredBar].compute * scaleRatio).toFixed(1)}</span>
                </li>
                <li className="flex justify-between space-x-4">
                  <span>Database:</span>
                  <span className="font-bold">${(BAR_DATA[hoveredBar].database * scaleRatio).toFixed(1)}</span>
                </li>
                <li className="flex justify-between space-x-4">
                  <span>Storage:</span>
                  <span className="font-bold">${(BAR_DATA[hoveredBar].storage * scaleRatio).toFixed(1)}</span>
                </li>
                <li className="flex justify-between space-x-4">
                  <span>Network:</span>
                  <span className="font-bold">${(BAR_DATA[hoveredBar].networking * scaleRatio).toFixed(1)}</span>
                </li>
                <li className="flex justify-between space-x-4 border-t border-gray-700 mt-1 pt-0.5 text-white font-sans font-bold">
                  <span>Total:</span>
                  <span className="text-green-400">${calculateSegments(BAR_DATA[hoveredBar]).total.toFixed(2)}</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* X-Axis Parent Legend text */}
        <div className="text-center font-bold text-[10px] text-gray-500 mt-2">
          Month (Year)
        </div>
      </div>
    </div>
  );
}
