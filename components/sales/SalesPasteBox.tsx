"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, AlertCircle, Send } from "lucide-react";

interface Props {
  onDataExtracted?: (data: any) => void;
}

export default function SalesPasteBox({ onDataExtracted }: Props) {
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleParse() {
    if (!text.trim()) return;
    setIsProcessing(true);
    setError("");

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

      // MAGIC: Pass data to main form (Bulletproofed to accept flat or wrapped JSON)
      if (onDataExtracted) {
         onDataExtracted(data.sale || data);
      }

      setIsSuccess(true);
      setText("");
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
              <CheckCircle2 size={14} /> Ready for review!
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
        // UPDATED HINT: Encourages typing multiple items!
        placeholder={`e.g. "Monica bought a red bag for 10k and 2 pairs of shoes for 5k each. She paid 15k total."`}
        className="w-full h-20 p-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#134e4a] transition-all resize-none disabled:opacity-50"
      />

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
    </div>
  );
}