"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSales, Sale } from "@/hooks/useSales";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, RotateCcw, CheckCircle2, Edit3 } from "lucide-react"; 
import VoiceRecorder from "@/components/sales/VoiceRecorder";
import SalesPasteBox from "@/components/sales/SalesPasteBox";
import SaleCard from "@/components/sales/SaleCard";
import InvoiceBrand from "@/components/sales/InvoiceBrand";
import InvoiceUploader from "@/components/sales/InvoiceUploader";
import { useInvoiceGenerator } from "@/hooks/useInvoiceGenerator";
import SaleReviewModal from "@/components/sales/SaleReviewModal";

export default function SalesPage() {
  const { sales, loading, todayNewSalesCash } = useSales();
  const [lastInsertedId, setLastInsertedId] = useState<string | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);

  const { invoiceRef, generateImage, profile } = useInvoiceGenerator();
  const [activeSaleForReceipt, setActiveSaleForReceipt] = useState<Sale | null>(null);

  // NEW STATES: One for the menu, one for the final modal
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [reviewData, setReviewData] = useState<any>(null);

  function daysSince(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days === 0 ? "Today" : `${days} day${days > 1 ? "s" : ""} ago`;
  }

  // Handles data coming from Voice, Scan, or Paste inside the Action Menu
  const handleExtractedData = (data: any) => {
    // Standardize the format if items array is missing
    if (!data.items) {
      data.items = [{
        name: data.item_name || "",
        quantity: 1,
        unit_price: parseFloat(data.total_amount) || 0,
        product_id: data.product_id || null
      }];
    }
    
    // Close the Action Menu and Open the Review Modal
    setShowActionMenu(false);
    setReviewData(data);
  };

  // Handles clicking the Manual Entry button
  const handleManualAdd = () => {
    setShowActionMenu(false);
    setReviewData({
      customer_name: "",
      customer_phone: "",
      amount_paid: "",
      items: [{ name: "", quantity: 1, unit_price: 0 }]
    });
  };

  const handleShare = async (sale: Sale) => {
    setActiveSaleForReceipt(sale);
    setTimeout(() => {
      generateImage(sale.customer_name || "Customer");
    }, 100);
  };

  async function restoreLeadAndInventory(sale: Sale) {
    const supabase = createClient();
    const targetStatus = "new"; 
    try {
      if (sale.lead_id) {
        await supabase.from("leads").update({ status: targetStatus }).eq("id", sale.lead_id);
      } else {
        await supabase.from("leads").update({ status: targetStatus }).ilike("full_name", sale.customer_name?.trim() || "");
      }
      const { error } = await supabase.from("sales").delete().eq("id", sale.id);
      if (!error) window.location.reload();
    } catch (err) {
      console.error("Restore failed:", err);
    }
  }

  async function handleReverseSale() {
    if (!lastInsertedId || isUndoing) return;
    try {
      setIsUndoing(true);
      const saleToUndo = sales.find(s => s.id === lastInsertedId);
      if (saleToUndo) {
        await restoreLeadAndInventory(saleToUndo);
        setLastInsertedId(null);
      }
    } catch (err) {
      alert("Undo failed.");
    } finally { setIsUndoing(false); }
  }

  async function handleDeleteSale(sale: Sale) {
    if (!window.confirm(`Restore ${sale.customer_name} to Active Leads?`)) return;
    try {
      await restoreLeadAndInventory(sale);
    } catch (err) {
      alert("Action failed.");
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-20 pb-28">
     {activeSaleForReceipt && (
        <InvoiceBrand ref={invoiceRef} sale={activeSaleForReceipt} profile={profile} />
      )}

      {/* TOP HEADER */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => setShowActionMenu(true)} 
          className="flex items-center gap-1.5 px-5 py-3 rounded-2xl text-white text-sm font-black shadow-lg bg-[#134e4a] active:scale-95 transition-transform"
        >
          <Plus size={18} /> Add Sale
        </button>
        <div className="text-right">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sales Cash Today</p>
           <p className="text-sm font-bold text-[#134e4a]">₦{(todayNewSalesCash || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* DASHBOARD LIST - Completely Clean! */}
      <div className="mt-2">
        <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-4 px-1">Money History</h2>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse" />)}</div>
        ) : sales.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-3xl border border-gray-100">
             <p className="text-sm font-bold text-gray-400">No sales recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sales.map((sale) => (
              <SaleCard 
                key={sale.id} 
                sale={sale} 
                daysSince={daysSince} 
                onDelete={handleDeleteSale}
                onShare={handleShare}
              />
            ))}
          </div>
        )}
      </div>

      {/* THE ACTION MENU MODAL */}
      <AnimatePresence>
        {showActionMenu && (
          <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ y: 100, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 100, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl max-h-[90vh] overflow-y-auto pb-10 sm:pb-6"
            >
               <div className="flex justify-between items-center mb-6">
                  <h2 className="font-black text-lg text-gray-900">Log a Sale</h2>
                  <button onClick={() => setShowActionMenu(false)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                    <X size={20}/>
                  </button>
               </div>

               <div className="space-y-4">
                  {/* Manual Button */}
                  <button 
                    onClick={handleManualAdd} 
                    className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-bold flex justify-center items-center gap-2 transition-colors"
                  >
                    <Edit3 size={18} /> Type Manually
                  </button>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-100"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-300 text-[10px] font-black uppercase tracking-widest">Or Use AI Auto-Fill</span>
                    <div className="flex-grow border-t border-gray-100"></div>
                  </div>

                  {/* AI Tools */}
                  <div className="space-y-2">
                    <InvoiceUploader onDataExtracted={handleExtractedData} scanType="sale" />
                    <VoiceRecorder onDataExtracted={handleExtractedData} />
                    <SalesPasteBox onDataExtracted={handleExtractedData} />
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UNDO TOAST */}
      <AnimatePresence>
        {lastInsertedId && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-24 left-4 right-4 z-[120] bg-[#134e4a] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-400" size={18} />
              <div><p className="text-[11px] font-black uppercase">Recorded!</p><p className="text-[9px] opacity-60 italic">Undo window open...</p></div>
            </div>
            <button onClick={handleReverseSale} disabled={isUndoing} className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
              <RotateCcw size={14} className={isUndoing ? "animate-spin" : ""} />
              <span className="text-[10px] font-black uppercase">{isUndoing ? "..." : "Undo"}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE UNIVERSAL REVIEW MODAL */}
      <AnimatePresence>
        {reviewData && (
          <SaleReviewModal 
            data={reviewData} 
            onClose={() => setReviewData(null)} 
            onSuccess={() => {
              setReviewData(null);
              setTimeout(() => window.location.reload(), 500);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}