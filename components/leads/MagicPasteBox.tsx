"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ClipboardPaste, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function MagicPasteBox() {
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleMagicPaste = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/ai/magic-paste", {
        method: "POST",
        body: JSON.stringify({ text }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "AI processing failed");
        return;
      }

      const lead = data.lead;
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Not logged in"); return; }

      const { error: insertError } = await supabase.from("leads").insert({
        user_id: user.id,
        full_name: lead.full_name ?? "Unknown",
        phone: lead.phone ?? null,
        item_of_interest: lead.item_of_interest ?? null,
        amount: lead.amount ? parseFloat(lead.amount) : null,
        status: lead.status ?? "new",
        intent_level: lead.intent_level ?? "medium",
        notes: lead.notes ?? null,
        input_method: "magic_paste",
        raw_paste_text: text,
        follow_up_due_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setIsSuccess(true);
      setText("");
      setTimeout(() => setIsSuccess(false), 3000);

    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[#e1ae1b]" />
          <h3 className="font-semibold text-gray-800 text-sm">Magic Paste</h3>
        </div>
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-[#2eb966] text-xs font-medium"
            >
              <CheckCircle2 size={14} /> Lead saved!
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
        placeholder="Paste WhatsApp chat... e.g. 'I am Tunde, I want the solar fan, my number is 0801...'"
        className="w-full h-24 p-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#134e4a] transition-all resize-none disabled:opacity-50"
      />

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleMagicPaste}
        disabled={!text.trim() || isProcessing}
        className="w-full mt-3 h-12 bg-[#134e4a] text-white rounded-full font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            AI is reading...
          </span>
        ) : (
          <><ClipboardPaste size={18} /> Add Lead</>
        )}
      </motion.button>
    </div>
  );
}