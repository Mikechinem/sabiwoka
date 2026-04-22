"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSales, Sale } from "@/hooks/useSales";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, RotateCcw, CheckCircle2 } from "lucide-react"; 
import VoiceRecorder from "@/components/sales/VoiceRecorder";
import SalesPasteBox from "@/components/sales/SalesPasteBox";

// NEW IMPORTS
import SaleCard from "@/components/sales/SaleCard";
import InvoiceBrand from "@/components/sales/InvoiceBrand";
import InvoiceUploader from "@/components/sales/InvoiceUploader";
import { useInvoiceGenerator } from "@/hooks/useInvoiceGenerator";

export default function SalesPage() {
  const { sales, loading, todaySales } = useSales();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastInsertedId, setLastInsertedId] = useState<string | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);

  // NEW STATE FOR PNG GENERATION
  const { invoiceRef, generateImage } = useInvoiceGenerator();
  const [activeSaleForReceipt, setActiveSaleForReceipt] = useState<Sale | null>(null);

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    item_name: "",
    total_amount: "",
    amount_paid: "",
  });

  function daysSince(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days === 0 ? "Today" : `${days} day${days > 1 ? "s" : ""} ago`;
  }

  const updateForm = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));

  // NEW: HANDLE AUTO-FILL FROM SCANNER
  const handleExtractedData = (data: any) => {
    setForm({
      customer_name: data.customer_name || "",
      customer_phone: data.customer_phone || "",
      item_name: data.item_name || "",
      total_amount: data.total_amount?.toString() || "",
      amount_paid: data.amount_paid?.toString() || "",
    });
  };

  // NEW: HANDLE PNG GENERATION TRIGGER
  const handleShare = async (sale: Sale) => {
    setActiveSaleForReceipt(sale);
    // Tiny timeout ensures the hidden InvoiceBrand has time to render the specific sale data
    setTimeout(() => {
      generateImage(sale.customer_name || "Customer");
    }, 100);
  };

  async function restoreLeadAndInventory(sale: Sale) {
    const supabase = createClient();
    const targetStatus = "new"; 
    if (sale.lead_id) {
      await supabase.from("leads").update({ status: targetStatus }).eq("id", sale.lead_id);
    } else {
      await supabase.from("leads").update({ status: targetStatus }).ilike("full_name", sale.customer_name?.trim() || "");
    }
    await supabase.from("sales").delete().eq("id", sale.id);
  }

  async function handleReverseSale() {
    if (!lastInsertedId || isUndoing) return;
    try {
      setIsUndoing(true);
      const saleToUndo = sales.find(s => s.id === lastInsertedId);
      if (saleToUndo) await restoreLeadAndInventory(saleToUndo);
      setLastInsertedId(null);
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

  async function handleAddSale() {
    if (!form.customer_name || !form.total_amount || !form.item_name) return;
    setSaving(true);
    const supabase = createClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const cleanName = form.customer_name.trim();
      const { data: matchedLead } = await supabase
        .from("leads")
        .select("id")
        .ilike("full_name", cleanName)
        .eq("user_id", user.id)
        .maybeSingle();

      const total = parseFloat(form.total_amount);
      const paid = parseFloat(form.amount_paid || "0");
      const status = paid === 0 ? "unpaid" : paid >= total ? "paid" : "partial";

      const { data: saleData, error: sErr } = await supabase.from("sales").insert({
        user_id: user.id, 
        lead_id: matchedLead?.id || null, 
        customer_name: cleanName,
        customer_phone: form.customer_phone,
        total_amount: total, 
        amount_paid: paid, 
        payment_status: status, 
        sold_at: new Date().toISOString()
      }).select().single();

      if (sErr) throw sErr;

      if (matchedLead) {
        await supabase.from("leads").update({ status: "paid" }).eq("id", matchedLead.id);
      }

      await supabase.from("sale_items").insert({
        sale_id: saleData.id, product_name: form.item_name, quantity: 1, unit_price: total
      });

      if (status !== "paid") {
        await supabase.from("debts").insert({ 
          user_id: user.id, 
          sale_id: saleData.id, 
          customer_name: cleanName, 
          customer_phone: form.customer_phone, 
          total_amount: total, 
          amount_paid: paid, 
          is_settled: false 
        });
      }

      setLastInsertedId(saleData.id);
      setTimeout(() => setLastInsertedId(null), 10000);
      setForm({ customer_name: "", customer_phone: "", item_name: "", total_amount: "", amount_paid: "" });
      setShowForm(false);
    } catch (err) { 
      alert("Save failed."); 
    } finally { 
      setSaving(false); 
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-20 pb-28">
      {/* HIDDEN INVOICE TEMPLATE FOR PNG GENERATION */}
      {activeSaleForReceipt && (
        <InvoiceBrand ref={invoiceRef} sale={activeSaleForReceipt} />
      )}

      <div className="flex items-center justify-between mb-8">
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-5 py-3 rounded-2xl text-white text-sm font-black shadow-lg bg-[#134e4a]">
          <Plus size={18} /> Add Sale
        </button>
        <div className="text-right">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sales Cash Today</p>
           <p className="text-sm font-bold text-[#134e4a]">₦{(todaySales || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-6 mb-12">
        <VoiceRecorder />
        <SalesPasteBox />
      </div>

      <div className="mt-2">
        <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-4 px-1">Money History</h2>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse" />)}</div>
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

      <AnimatePresence>
        {lastInsertedId && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-24 left-4 right-4 z-50 bg-[#134e4a] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between">
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

      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
             <div className="flex justify-between mb-6">
                <h2 className="font-black text-lg">New Sale</h2>
                <button onClick={() => setShowForm(false)}><X size={20}/></button>
             </div>

             {/* AUTO-FILL SCANNER SECTION */}
             <InvoiceUploader onDataExtracted={handleExtractedData} />

             <div className="space-y-4 mb-6">
                <input placeholder="Customer Name" className="w-full p-4 bg-gray-50 rounded-2xl text-sm" value={form.customer_name} onChange={e => updateForm('customer_name', e.target.value)} />
                <input placeholder="Phone Number" className="w-full p-4 bg-gray-50 rounded-2xl text-sm" value={form.customer_phone} onChange={e => updateForm('customer_phone', e.target.value)} />
                <input placeholder="Item Bought" className="w-full p-4 bg-gray-100/50 rounded-2xl text-sm font-bold" value={form.item_name} onChange={e => updateForm('item_name', e.target.value)} />
                <div className="flex gap-2">
                  <input placeholder="Price" type="number" className="w-1/2 p-4 bg-gray-50 rounded-2xl text-sm" value={form.total_amount} onChange={e => updateForm('total_amount', e.target.value)} />
                  <input placeholder="Paid" type="number" className="w-1/2 p-4 bg-gray-50 rounded-2xl text-sm" value={form.amount_paid} onChange={e => updateForm('amount_paid', e.target.value)} />
                </div>
             </div>
             <button onClick={handleAddSale} disabled={saving} className="w-full py-4 bg-[#134e4a] text-white rounded-2xl font-black">{saving ? "Saving..." : "Record Sale"}</button>
          </div>
        </div>
      )}
    </div>
  );
}