"use client";

import PaymentScanner from "@/components/scanner/PaymentScanner";
import { ShieldCheck } from "lucide-react";

export default function ScannerPage() {
  return (
    // 1. ADD: 'page-no-profile' class to hide the icon. (This assumes your global layout is set to look for this class).
    <div className="max-w-md mx-auto px-4 pt-24 pb-28 page-no-profile">
      
      <header className="mb-8 px-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-teal-100 p-1.5 rounded-lg text-[#134e4a]">
            <ShieldCheck size={16} />
          </div>
          <p className="text-[10px] font-black text-[#134e4a] uppercase tracking-[0.2em]">
            Security & Verification
          </p>
        </div>
        
        <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-3">
          Sabi Scanner 🔍
        </h1>
        
        <p className="text-xs text-gray-500 leading-relaxed font-medium">
          Point your camera at a bank transfer receipt or SMS alert to verify the payment and check for fake alerts.
        </p>
      </header>

      {/* 2. THE SCANNER WITH A NEW BORDER */}
      <div className="relative z-10 mt-8">
        {/* ADD: Border, Padding, and Radius around the scanner */}
        <div className="border-4 border-[#134e4a] p-3 rounded-[3rem] bg-white shadow-[0_10px_40px_rgba(19,78,74,0.15)]">
          <PaymentScanner />
        </div>
      </div>

      <div className="mt-8 p-6 bg-amber-50 rounded-[2rem] border border-amber-100">
        <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">How it works</h4>
        <p className="text-[11px] text-amber-600/80 leading-relaxed font-medium">
          Our AI analyzes fonts, alignment, and bank headers used by Nigerian banks to detect common fraud patterns. Always verify with your bank app for 100% certainty.
        </p>
      </div>
    </div>
  );
}