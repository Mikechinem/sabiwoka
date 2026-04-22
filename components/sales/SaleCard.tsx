"use client";

import { Sale } from "@/hooks/useSales";
import { ShoppingBag, Clock, RotateCcw, Share2 } from "lucide-react";

interface SaleCardProps {
  sale: Sale;
  daysSince: (dateStr: string) => string;
  onDelete: (sale: Sale) => void;
  onShare: (sale: Sale) => void; // New function for generating the PNG
}

export default function SaleCard({ sale, daysSince, onDelete, onShare }: SaleCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 relative group">
      {/* Undo/Mistake Button */}
      <button 
        onClick={() => onDelete(sale)}
        className="absolute top-4 right-4 flex items-center gap-1.5 p-2 px-3 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"
      >
        <RotateCcw size={12} className="shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-tighter">Mistake?</span>
      </button>

      <div className="flex items-start justify-between mb-1">
        <div className="pr-20">
          <h3 className="font-bold text-gray-900 text-sm">{sale.customer_name}</h3>
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            <ShoppingBag size={10} /> {sale.sale_items?.[0]?.product_name || "General Sale"}
          </p>
          
          <p className="text-[10px] text-gray-300 flex items-center gap-1 mt-1">
            <Clock size={10} /> {daysSince(sale.sold_at)}
          </p>
        </div>
        <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-md bg-gray-50 text-gray-500">
          {sale.payment_status}
        </span>
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
        <div className="flex gap-4">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Paid</p>
            <p className="font-bold text-[#2eb966] text-xs">₦{Number(sale.amount_paid).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Total</p>
            <p className="font-bold text-gray-900 text-xs">₦{Number(sale.total_amount).toLocaleString()}</p>
          </div>
        </div>

        {/* --- NEW SHARE BUTTON --- */}
        <button 
          onClick={() => onShare(sale)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#134e4a] text-white rounded-xl active:scale-95 transition-all"
        >
          <Share2 size={12} />
          <span className="text-[10px] font-black uppercase">Share PNG</span>
        </button>
      </div>
    </div>
  );
}