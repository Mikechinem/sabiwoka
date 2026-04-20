"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSales, Sale } from "@/hooks/useSales";
import { createClient } from "@/lib/supabase/client";
import { Plus, ShoppingBag, Clock, X, Mic, Sparkles, PenLine, RotateCcw } from "lucide-react";
import VoiceRecorder from "@/components/sales/VoiceRecorder";
import SalesPasteBox from "@/components/sales/SalesPasteBox";

const statusConfig = {
  paid: { label: "Paid", color: "#2eb966", bg: "#f0fdf4" },
  partial: { label: "Partial", color: "#e1ae1b", bg: "#fefce8" },
  unpaid: { label: "Unpaid", color: "#ef4444", bg: "#fef2f2" },
};

const inputMethodConfig = {
  manual: { label: "Manual", icon: PenLine, color: "#6b7280", bg: "#f3f4f6" },
  magic_paste: { label: "Magic Paste", icon: Sparkles, color: "#e1ae1b", bg: "#fefce8" },
  voice: { label: "Voice", icon: Mic, color: "#134e4a", bg: "#f0fdf4" },
  invoice_scan: { label: "Invoice Scan", icon: Sparkles, color: "#4685ed", bg: "#eff6ff" },
};

export default function SalesPage() {
  const { sales, loading, todayRevenue } = useSales();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    item_name: "",
    total_amount: "",
    amount_paid: "",
    notes: "",
  });

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleMarkUnpaid(sale: Sale) {
    const supabase = createClient();
    try {
      // 1. Update Sale
      const { error: saleError } = await supabase
        .from("sales")
        .update({ amount_paid: 0, payment_status: "unpaid" })
        .eq("id", sale.id);
      if (saleError) throw saleError;

      // 2. Manage Debt
      const { data: existingDebt } = await supabase
        .from("debts")
        .select("id")
        .eq("sale_id", sale.id)
        .single();

      if (existingDebt) {
        await supabase.from("debts").update({ amount_paid: 0, is_settled: false, updated_at: new Date().toISOString() }).eq("id", existingDebt.id);
      } else {
        await supabase.from("debts").insert({
          user_id: sale.user_id, sale_id: sale.id, lead_id: sale.lead_id,
          customer_name: sale.customer_name || "Customer", customer_phone: sale.customer_phone,
          total_amount: sale.total_amount, amount_paid: 0, is_settled: false,
        });
      }

      // 3. Move Lead back to active
      if (sale.lead_id) {
        await supabase.from("leads").update({ status: "interested", updated_at: new Date().toISOString() }).eq("id", sale.lead_id);
      }
    } catch (err) {
      alert("Failed to revert sale. Please try again.");
    }
  }

  async function handleAddSale() {
    if (!form.customer_name || !form.total_amount) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const total = parseFloat(form.total_amount);
    const paid = parseFloat(form.amount_paid || "0");
    const paymentStatus = paid === 0 ? "unpaid" : paid >= total ? "paid" : "partial";

    const { data: saleData, error: saleError } = await supabase
      .from("sales")
      .insert({
        user_id: user.id, customer_name: form.customer_name, customer_phone: form.customer_phone || null,
        total_amount: total, amount_paid: paid, payment_status: paymentStatus,
        input_method: "manual", notes: form.notes || null, sold_at: new Date().toISOString(),
      })
      .select().single();

    if (!saleError && saleData) {
      if (form.item_name) {
        await supabase.from("sale_items").insert({ sale_id: saleData.id, product_name: form.item_name, quantity: 1, unit_price: total });
      }
      if (paymentStatus !== "paid") {
        await supabase.from("debts").insert({
          user_id: user.id, sale_id: saleData.id, customer_name: form.customer_name,
          customer_phone: form.customer_phone || null, total_amount: total, amount_paid: paid, is_settled: false,
        });
      }
    }
    setForm({ customer_name: "", customer_phone: "", item_name: "", total_amount: "", amount_paid: "", notes: "" });
    setShowForm(false);
    setSaving(false);
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28">
      <header className="relative mb-8 pt-4">
        <div className="absolute -top-2 -right-4 w-24 h-24 bg-[#2eb966]/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-[#134e4a] flex items-center justify-center text-white shadow-lg">
                <span className="text-lg">💰</span>
              </div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Money</h1>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-gray-500 font-medium text-sm">Today:</p>
              <span className="text-xl font-black text-[#134e4a]">₦{todayRevenue.toLocaleString()}</span>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-white text-sm font-bold shadow-md" style={{ background: "#134e4a" }}>
            <Plus size={16} /> Add Sale
          </motion.button>
        </div>
      </header>

      <div className="mt-10 space-y-8 mb-12">
        <div className="px-1"><p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-3">Quick Record</p><VoiceRecorder /></div>
        <div className="px-1"><p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-3">Paste from WhatsApp</p><SalesPasteBox /></div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6" style={{ background: "rgba(0,0,0,0.4)" }}>
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="w-full max-w-md bg-white rounded-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900">New Sale</h2>
                <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                {[
                  { key: "customer_name", label: "Customer Name *", placeholder: "Ada Okonkwo", type: "text" },
                  { key: "customer_phone", label: "Phone Number", placeholder: "08012345678", type: "tel" },
                  { key: "item_name", label: "Item Sold", placeholder: "Red ankara fabric", type: "text" },
                  { key: "total_amount", label: "Total Amount (₦) *", placeholder: "25000", type: "number" },
                  { key: "amount_paid", label: "Amount Paid (₦)", placeholder: "0 if not paid yet", type: "number" },
                  { key: "notes", label: "Notes", placeholder: "Any extra details...", type: "text" },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input type={type} placeholder={placeholder} value={form[key as keyof typeof form]} onChange={(e) => updateForm(key, e.target.value)} className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none transition-all" />
                  </div>
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddSale} disabled={!form.customer_name || !form.total_amount || saving} className="w-full h-12 rounded-full text-white font-bold text-sm mt-5 disabled:opacity-50" style={{ background: "#134e4a" }}>
                {saving ? "Saving..." : "Record Sale"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-2">
        <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-4 px-1">Money History</h2>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />))}</div>
        ) : sales.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
            <ShoppingBag size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Record your first sale of the day. ✨</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sales.map((sale) => {
              const status = statusConfig[sale.payment_status as keyof typeof statusConfig] ?? statusConfig.unpaid;
              const method = inputMethodConfig[sale.input_method as keyof typeof inputMethodConfig] ?? inputMethodConfig.manual;
              const MethodIcon = method.icon;
              return (
                <motion.div key={sale.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0"><h3 className="font-bold text-gray-900 text-sm">{sale.customer_name}</h3>{sale.customer_phone && <p className="text-xs text-gray-400">{sale.customer_phone}</p>}</div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <span className="flex items-center gap-1 text-[10px] uppercase font-black px-2 py-0.5 rounded-md" style={{ color: method.color, background: method.bg }}><MethodIcon size={10} />{method.label}</span>
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md" style={{ color: status.color, background: status.bg }}>{status.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div><p className="text-[10px] uppercase font-bold text-gray-400">Total</p><p className="font-bold text-gray-900">₦{Number(sale.total_amount).toLocaleString()}</p></div>
                    <div><p className="text-[10px] uppercase font-bold text-gray-400">Received</p><p className="font-bold text-[#2eb966]">₦{Number(sale.amount_paid).toLocaleString()}</p></div>
                    {Number(sale.balance) > 0 && (<div className="text-right"><p className="text-[10px] uppercase font-bold text-gray-400">Balance</p><p className="font-bold text-red-500">₦{Number(sale.balance).toLocaleString()}</p></div>)}
                  </div>
                  {sale.notes && (<p className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-xl mb-2">{sale.notes}</p>)}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1 text-[10px] text-gray-300"><Clock size={10} />{new Date(sale.sold_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                    {sale.payment_status === "paid" && (
                      <button onClick={() => { if(confirm("Mark as unpaid? This will move the lead back to active.")) handleMarkUnpaid(sale); }} className="flex items-center gap-1 text-[10px] font-black text-amber-600 hover:text-amber-700 uppercase tracking-tighter"><RotateCcw size={10} /> Mistake?</button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}