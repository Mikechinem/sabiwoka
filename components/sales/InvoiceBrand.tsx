"use client";

import { forwardRef } from "react";
import { Sale } from "@/hooks/useSales";
import { ShieldCheck } from "lucide-react";

interface Props {
  sale: Sale;
  businessName?: string;
}

const InvoiceBrand = forwardRef<HTMLDivElement, Props>(({ sale, businessName = "SABI WOKA STORE" }, ref) => {
  return (
    <div className="absolute -left-[9999px] top-0"> {/* Keep it off-screen */}
      <div 
        ref={ref}
        className="w-[400px] bg-white p-8 font-sans text-gray-900"
        style={{ minHeight: '500px' }}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8 border-b-2 border-gray-50 pb-6">
          <div className="w-12 h-12 bg-[#134e4a] rounded-2xl flex items-center justify-center text-white mb-3">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tighter text-[#134e4a]">{businessName}</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Official Purchase Receipt</p>
        </div>

        {/* Transaction Details */}
        <div className="space-y-4 mb-8">
          <div className="flex justify-between">
            <span className="text-[11px] font-black text-gray-400 uppercase">Customer</span>
            <span className="text-sm font-bold">{sale.customer_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[11px] font-black text-gray-400 uppercase">Date</span>
            <span className="text-sm font-bold">{new Date(sale.sold_at).toLocaleDateString('en-NG')}</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="border-y-2 border-gray-50 py-6 mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-[11px] font-black text-gray-400 uppercase">Item Description</span>
            <span className="text-[11px] font-black text-gray-400 uppercase">Amount</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-800">{sale.sale_items?.[0]?.product_name || "General Sale"}</span>
            <span className="text-sm font-black">₦{Number(sale.total_amount).toLocaleString()}</span>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-3 bg-gray-50 p-5 rounded-[2rem]">
          <div className="flex justify-between items-center text-[#134e4a]">
            <span className="text-xs font-black uppercase">Amount Paid</span>
            <span className="text-lg font-black">₦{Number(sale.amount_paid).toLocaleString()}</span>
          </div>
          
          {sale.payment_status !== 'paid' && (
            <div className="flex justify-between items-center text-red-500 border-t border-red-100 pt-2">
              <span className="text-[10px] font-black uppercase">Balance Due</span>
              <span className="text-xs font-bold">₦{(sale.total_amount - sale.amount_paid).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-[11px] font-bold text-gray-400 italic">Thank you for your patronage!</p>
          <div className="mt-4 flex justify-center opacity-20">
             <span className="text-[8px] font-black tracking-[0.3em] uppercase">Verified by SabiWoka</span>
          </div>
        </div>
      </div>
    </div>
  );
});

InvoiceBrand.displayName = "InvoiceBrand";
export default InvoiceBrand;