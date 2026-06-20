import React from 'react';
import { RegionConfig } from '../types';
import { ShieldCheck, Info } from 'lucide-react';

interface SecurityWidgetProps {
  activeRegion: RegionConfig;
}

export default function SecurityWidget({ activeRegion }: SecurityWidgetProps) {
  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Region subtext */}
        <div className="text-[11px] text-gray-500 mb-2 font-medium">
          Region: {activeRegion.code}
        </div>

        {/* Security Score Box */}
        <div className="border border-aws-border p-3 bg-gray-50/35 relative mb-4 rounded-[2px]">
          <div className="flex items-center justify-between text-[11px] font-medium text-aws-text-secondary">
            <span className="border-b border-dotted border-gray-400 cursor-help" title="Overall AWS Security Hub posture compliance rating">
              Security score
            </span>
            <a href="#security-details" className="text-aws-blue-accent hover:underline font-semibold text-[11px] transition-all duration-200">
              Details
            </a>
          </div>

          {/* Large mustard-yellow KPI metric */}
          <div className="text-4xl md:text-5xl font-black text-aws-mustard tracking-tight mt-1 mb-0.5 select-all">
            {activeRegion.securityScore}%
          </div>
        </div>

        {/* Data points vertical list */}
        <ul className="space-y-2 border-b border-aws-border pb-3 mb-3 text-[13px]">
          <li className="flex justify-between items-center">
            <span className="text-aws-blue-accent hover:underline cursor-pointer font-medium transition-all duration-200">
              Failed controls
            </span>
            <span className="font-bold text-aws-heading">{activeRegion.failedControls}</span>
          </li>
          <li className="flex justify-between items-center">
            <span className="text-aws-blue-accent hover:underline cursor-pointer font-medium transition-all duration-200">
              Critical severity findings
            </span>
            <span className="font-bold text-aws-heading bg-red-50 text-red-700 px-1.5 py-0.2 rounded text-[11px]">
              {activeRegion.criticalFindings}
            </span>
          </li>
          <li className="flex justify-between items-center">
            <span className="text-aws-blue-accent hover:underline cursor-pointer font-medium transition-all duration-200">
              High severity findings
            </span>
            <span className="font-bold text-aws-heading bg-orange-50 text-orange-700 px-1.5 py-0.2 rounded text-[11px]">
              {activeRegion.highFindings}
            </span>
          </li>
        </ul>
      </div>

      {/* Scope, updates, and Navigation link */}
      <div>
        <div className="text-[11px] text-gray-400 space-y-0.5 mb-3 leading-tight font-medium">
          <div>Scope: <span className="text-gray-600">This account, All linked Regions</span></div>
          <div>Last updated: <span className="text-gray-500">23 hours ago</span></div>
        </div>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-aws-border">
          <a
            href="#security-hub"
            className="text-aws-blue-accent hover:underline text-[13px] font-semibold inline-flex items-center space-x-1 transition-all duration-200 ease-in-out"
          >
            <span>Go to Security Hub</span>
          </a>
        </div>
      </div>
    </div>
  );
}
