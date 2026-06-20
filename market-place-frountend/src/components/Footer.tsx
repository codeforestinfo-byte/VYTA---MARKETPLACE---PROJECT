import React from 'react';
import { Globe, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onGoHome: () => void;
  deliveryRegion: string;
}

export default function Footer({ onGoHome, deliveryRegion }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const serviceGrid = [
    { name: 'PureFuel BioTech', desc: 'Gold standard whey isolates & creatine' },
    { name: 'MuscleLab Nutrition', desc: 'Premium BCAAs, pre-workouts & gainers' },
    { name: 'VeganPro Supplements', desc: 'Organic plant proteins & superfoods' },
    { name: 'Elite Athlete Series', desc: 'Medical-grade EAAs & recovery blends' },
    { name: 'Whey Science Co', desc: 'Hydrolyzed whey & casein proteins' },
    { name: 'PlantFuel Labs', desc: 'Vegan protein blends & greens powders' },
    { name: 'Creatine Direct', desc: 'Pure micronized creatine monohydrate' },
    { name: 'Amino Core', desc: 'BCAA & EAA recovery complexes' },
    { name: 'Pre Lab Pro', desc: 'Stim & stim-free pre-workout formulas' },
    { name: 'Mass Build Pro', desc: 'High-calorie mass gainers & weight blends' },
    { name: 'Recovery X', desc: 'Night-time casein & repair formulas' },
    { name: 'VYTA Nutrition', desc: 'Curated supplement bundles & stacks' }
  ];

  return (
    <footer className="bg-[#132836] text-gray-300 font-sans text-xs mt-auto" id="global-footer">
      <button
        onClick={scrollToTop}
        className="w-full bg-[black] hover:bg-[#1c3d52] text-white text-center py-4 font-medium transition cursor-pointer select-none text-xs border-b border-[#132836]"
        id="footer-back-to-top"
      >
        Back to top
      </button>

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-left border-b border-[#1c3d52]/25">
        <div>
          <h4 className="text-white font-bold text-sm mb-3">Get to Know Us</h4>
          <ul className="space-y-2 text-gray-400">
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Careers at VYTA</span></li>
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">About Our Marketplace</span></li>
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">VYTA Science & Design</span></li>
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Sustainable Nutrition Initiatives</span></li>
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Press Center announcements</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3">Make Money with Us</h4>
          <ul className="space-y-2 text-gray-400">
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Sell your supplements</span></li>
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Sell on VYTA Business</span></li>
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Advertise Your Nutrition Brand</span></li>
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Self-Publish Training Ebooks</span></li>
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Host a VYTA Nutrition Hub</span></li>
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Become an Athletic Affiliate</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3">Health & Payment Products</h4>
          <ul className="space-y-2 text-gray-400">
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">VYTA Business Reward Card</span></li>
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Shop with Nutrition Coins</span></li>
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Reload Your Workout Balance</span></li>
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">VYTA Currency Converter</span></li>
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Gift cards & cash credits</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3">Let Us Help You</h4>
          <ul className="space-y-2 text-gray-400">
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">VYTA & Active Lifestyles</span></li>
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Your Nutrition Account Portal</span></li>
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Shipping Rates & Speed Policies</span></li>
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Returns & Refund Policy</span></li>
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Manage Your Ebook Content</span></li>
            <li><span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Customer Service Desk</span></li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#1c3d52]/25">
          <div onClick={onGoHome} className="flex items-center cursor-pointer select-none" id="footer-logo">
            <img src="/logo.png" alt="Vyta" className="h-8 w-auto" />
          </div>

        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-white">
          <div className="border border-[#1c3d52]/45 px-3 py-1.5 rounded flex items-center gap-1 bg-[black]">
            <Globe className="h-3.5 w-3.5 text-[#1b73b3]" />
            <span>English</span>
          </div>
          <div className="border border-[#1c3d52]/45 px-3 py-1.5 rounded flex items-center gap-1 bg-[black]">
            <span className="text-[#1b73b3] font-bold font-mono">₨</span>
            <span>LKR Sri Lankan Rupee</span>
          </div>
          <div className="border border-[#1c3d52]/45 px-3 py-1.5 rounded flex items-center gap-1 bg-[black]">
            <span>{deliveryRegion} (Delivery Region)</span>
          </div>
        </div>
      </div>

      <div className="bg-[black]/85 text-gray-400 py-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 text-left">
          {serviceGrid.map((svc) => (
            <div key={svc.name} className="flex flex-col select-none group cursor-pointer">
              <span className="text-white text-[11px] font-bold group-hover:underline transition group-hover:text-[#1b73b3]">
                {svc.name}
              </span>
              <span className="text-[10px] leading-tight text-gray-500 mt-0.5">
                {svc.desc}
              </span>
            </div>
          ))}
        </div>

        <div className="max-w-6xl mx-auto text-center border-t border-[#1c3d52]/30 pt-6 mt-10">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] text-[#1c3d52] mb-3 font-semibold uppercase">
            <span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Conditions of Sale</span>
            <span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Privacy Notice</span>
            <span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Consumer Health Policies</span>
            <span className="hover:underline cursor-pointer hover:text-[#1b73b3]">Interactive Advertising Choices</span>
          </div>
          <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#1b73b3] inline animate-pulse" />
            © 2026 VYTA Nutrition Marketplace. All rights reserved. Multi-vendor platform for premium proteins and sports supplements.
          </p>
        </div>
      </div>
    </footer>
  );
}
