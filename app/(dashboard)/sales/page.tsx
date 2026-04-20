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
      await supabase.from("sales").update({ amount_paid: 0, payment_status: "unpaid" }).eq("id", sale.id);
      const { data: existingDebt } = await supabase.from("debts").select("id").eq("sale_id", sale.id).single();
      if (existingDebt) {
        await supabase.from("debts").update({ amount_paid: 0, is_settled: false }).eq("id", existingDebt.id);
      } else {
        await supabase.from("debts").insert({ user_id: sale.user_id, sale_id: sale.id, customer_name: sale.customer_name, total_amount: sale.total_amount, amount_paid: 0, is_settled: false });
      }
    } catch (err) { alert("Failed to revert sale."); }
  }

  async function handleAddSale() {
    if (!form.customer_name || !form.total_amount) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const total = parseFloat(form.total_amount);
    const paid = parseFloat(form.amount_paid || "0");
    const status = paid === 0 ? "unpaid" : paid >= total ? "paid" : "partial";

    const { data: saleData } = await supabase.from("sales").insert({
      user_id: user.id, customer_name: form.customer_name, total_amount: total, amount_paid: paid, payment_status: status, input_method: "manual", sold_at: new Date().toISOString(),
    }).select().single();

    if (saleData && status !== "paid") {
      await supabase.from("debts").insert({ user_id: user.id, sale_id: saleData.id, customer_name: form.customer_name, total_amount: total, amount_paid: paid, is_settled: false });
    }
    setForm({ customer_name: "", customer_phone: "", item_name: "", total_amount: "", amount_paid: "", notes: "" });
    setShowForm(false);
    setSaving(false);
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-20 pb-28">
      {/* Left-Aligned Action Button */}
      <div className="flex items-center justify-between mb-8">
        <motion.button 
          whileTap={{ scale: 0.95 }} 
          onClick={() => setShowForm(true)} 
          className="flex items-center gap-1.5 px-5 py-3 rounded-2xl text-white text-sm font-black shadow-lg bg-[#134e4a]"
        >
          <Plus size={18} /> Add Sale
        </motion.button>
        <div className="text-right">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Today Sales</p>
           <p className="text-sm font-bold text-[#134e4a]">₦{todayRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-8 mb-12">
        <div className="px-1"><p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-3">Quick Record</p><VoiceRecorder /></div>
        <div className="px-1"><p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-3">Paste from WhatsApp</p><SalesPasteBox /></div>
      </div>

      <div className="mt-2">
        <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-4 px-1">Money History</h2>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />))}</div>
        ) : sales.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
            <ShoppingBag size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">No sales recorded today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sales.map((sale) => {
              const status = statusConfig[sale.payment_status as keyof typeof statusConfig] ?? statusConfig.unpaid;
              const method = inputMethodConfig[sale.input_method as keyof typeof inputMethodConfig] ?? inputMethodConfig.manual;
              const MethodIcon = method.icon;
              return (
                <motion.div key={sale.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0"><h3 className="font-bold text-gray-900 text-sm">{sale.customer_name}</h3></div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md" style={{ color: status.color, background: status.bg }}>{status.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div><p className="text-[10px] font-black text-gray-400 uppercase">Paid</p><p className="font-bold text-[#2eb966]">₦{Number(sale.amount_paid).toLocaleString()}</p></div>
                    <div className="text-right"><p className="text-[10px] font-black text-gray-400 uppercase">Total</p><p className="font-bold text-gray-900">₦{Number(sale.total_amount).toLocaleString()}</p></div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Sale Modal remains identical to Lead logic */}
    </div>
  );
}