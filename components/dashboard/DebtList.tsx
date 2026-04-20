"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Sparkles, Loader2, User } from "lucide-react";
import WhatsAppButton from "@/components/shared/WhatsAppButton";

interface Debt {
  id: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  amount_paid: number;
  item_name?: string;
}

export default function DebtList({ debts }: { debts: Debt[] }) {
  const [nudgingId, setNudgingId] = useState<string | null>(null);

  const triggerDebtNudge = async (debt: Debt) => {
    try {
      setNudgingId(debt.id);
      const res = await fetch("/api/ai/debt-message", {
        method: "POST",
        body: JSON.stringify({
          customerName: debt.customer_name,
          amount: debt.total_amount - debt.amount_paid,
          item: debt.item_name || "the items purchased"
        }),
      });
      const data = await res.json();
      
      const phone = debt.customer_phone.replace(/[^0-9]/g, "");
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(data.message)}`, "_blank");
    } finally {
      setNudgingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {debts.map((debt) => (
        <motion.div 
          key={debt.id} 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{debt.customer_name}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Balance: <span className="text-red-500">₦{(debt.total_amount - debt.amount_paid).toLocaleString()}</span>
              </p>
            </div>
            <WhatsAppButton 
              phone={debt.customer_phone}
              message="" // AI will fill this
              label="Nudge AI"
              loading={nudgingId === debt.id}
              onClick={() => triggerDebtNudge(debt)}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}