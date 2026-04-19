"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SalesPasteBox() {
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleParse() {
    if (!text.trim()) return;
    setIsProcessing(true);
    setError("");
    setPreview(null);

    try {
      const response = await fetch("/api/ai/sales-paste", {
        method: "POST",
        body: JSON.stringify({ text }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "AI processing failed");
        return;
      }

      setPreview(data.sale);

    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    setIsProcessing(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Not logged in"); return; }

      const total = parseFloat(preview.total_amount) || 0;
      const paid = parseFloat(preview.amount_paid) || 0;
      const paymentStatus = paid === 0 ? "unpaid" : paid >= total ? "paid" : "partial";

      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert({
          user_id: user.id,
          customer_name: preview.customer_name ?? "Unknown",
          customer_phone: preview.customer_phone ?? null,
          total_amount: total,
          amount_paid: paid,
          payment_status: paymentStatus,
          input_method: "manual",
          notes: preview.notes ?? null,
          sold_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (saleError) { setError(saleError.message); return; }

      if (preview.item_name) {
        await supabase.from("sale_items").insert({
          sale_id: saleData.id,
          product_name: preview.item_name,
          quantity: 1,
          unit_price: total,
        });
      }

      if (paymentStatus !== "paid") {
        await supabase.from("debts").insert({
          user_id: user.id,
          sale_id: saleData.id,
          customer_name: preview.customer_name ?? "Unknown",
          customer_phone: preview.customer_phone ?? null,
          total_amount: total,
          amount_paid: paid,
          is_settled: false,
        });
      }

      setIsSuccess(true);
      setText("");
      setPreview(null);
      setTimeout(() => setIsSuccess(false), 3000);

    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[#e1ae1b]" />
          <h3 className="font-semibold text-gray-800 text-sm">Smart Log</h3>
        </div>
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-[#2eb966] text-xs font-medium"
            >
              <CheckCircle2 size={14} /> Sale saved!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-50 rounded-xl text-xs text-red-600"
        >
          <AlertCircle size={13} />
          {error}
        </motion.div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isProcessing}
        placeholder={`Type naturally... e.g. "Monica paid for red ankara, she gave me 10k, balance remains 5k"`}
        className="w-full h-20 p-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#134e4a] transition-all resize-none disabled:opacity-50"
      />

      {/* AI Preview card — shows before saving */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
          >
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              AI extracted — confirm before saving
            </p>
            <div className="space-y-1">
              {[
                { label: "Customer", value: preview.customer_name },
                { label: "Phone", value: preview.customer_phone },
                { label: "Item", value: preview.item_name },
                { label: "Total", value: preview.total_amount ? `₦${Number(preview.total_amount).toLocaleString()}` : null },
                { label: "Paid", value: preview.amount_paid ? `₦${Number(preview.amount_paid).toLocaleString()}` : "₦0" },
                { label: "Balance", value: preview.total_amount && preview.amount_paid ? `₦${(Number(preview.total_amount) - Number(preview.amount_paid)).toLocaleString()}` : null },
                { label: "Notes", value: preview.notes },
              ].filter(item => item.value).map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-semibold text-gray-800">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setPreview(null)}
                className="flex-1 h-9 rounded-full border border-gray-200 text-xs font-semibold text-gray-500"
              >
                Edit
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1 h-9 rounded-full text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
                style={{ background: "#134e4a" }}
              >
                <CheckCircle2 size={13} />
                {isProcessing ? "Saving..." : "Confirm & Save"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!preview && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleParse}
          disabled={!text.trim() || isProcessing}
          className="w-full mt-3 h-11 rounded-full text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
          style={{ background: "#134e4a" }}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AI is reading...
            </span>
          ) : (
            <><Send size={15} /> Log Sale</>
          )}
        </motion.button>
      )}
    </div>
  );
}