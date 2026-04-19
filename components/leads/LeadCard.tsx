"use client";

import { motion } from "framer-motion";
import { Phone, ShoppingBag, AlertCircle, CheckCircle2, Clock, MessageCircle, XCircle } from "lucide-react";
import Link from "next/link";
import type { Lead } from "@/hooks/useLeads";

const statusConfig = {
  new: { label: "New", color: "#6b7280", bg: "#f3f4f6" },
  contacted: { label: "Contacted", color: "#134e4a", bg: "#f0fdf4" },
  interested: { label: "Interested", color: "#e1ae1b", bg: "#fefce8" },
  paid: { label: "Paid", color: "#2eb966", bg: "#f0fdf4" },
  lost: { label: "Lost", color: "#9ca3af", bg: "#f3f4f6" }, // Changed to a neutral grey
};

const intentConfig = {
  high: { label: "Hot", color: "#ef4444" },
  medium: { label: "Warm", color: "#e1ae1b" },
  low: { label: "Cold", color: "#6b7280" },
};

export default function LeadCard({ lead }: { lead: Lead }) {
  const status = statusConfig[lead.status] ?? statusConfig.new;
  const intent = intentConfig[lead.intent_level] ?? intentConfig.medium;

  const isClosed = lead.status === "paid" || lead.status === "lost";
  const isOverdue = lead.follow_up_due_at
    ? new Date(lead.follow_up_due_at) < new Date() && !isClosed
    : false;

  function sendReminder(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!lead.phone) return;

    const item = lead.item_of_interest ? `the ${lead.item_of_interest}` : "your order";
    const amount = lead.amount ? ` Your balance is ₦${Number(lead.amount).toLocaleString()}.` : "";
    const message = encodeURIComponent(
      `Hi ${lead.full_name}, just checking in about ${item}.${amount} Please let us know when you are ready. Thank you!`
    );
    const phone = lead.phone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  }

  return (
    <Link href={`/leads/${lead.id}`}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        className={`rounded-2xl border p-4 mb-3 flex flex-col gap-3 transition-all ${
          lead.status === "lost" 
            ? "bg-gray-50/50 border-gray-100 opacity-60 grayscale-[0.5]" 
            : "bg-white border-gray-100 shadow-sm"
        }`}
      >
        {/* Top row — name and badges */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-sm truncate ${lead.status === "lost" ? "text-gray-500" : "text-gray-900"}`}>
              {lead.full_name}
            </h3>
            {lead.phone && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <Phone size={10} />
                {lead.phone}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            {!isClosed && (
               <span
               className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md"
               style={{ color: intent.color, background: `${intent.color}15` }}
             >
               {intent.label}
             </span>
            )}
            <span
              className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md"
              style={{ color: status.color, background: status.bg }}
            >
              {status.label}
            </span>
          </div>
        </div>

        {/* Item and amount */}
        {lead.item_of_interest && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <ShoppingBag size={12} />
            <span className="truncate">{lead.item_of_interest}</span>
            {lead.amount && (
              <span className={`ml-auto font-bold shrink-0 ${lead.status === "lost" ? "text-gray-400" : "text-gray-900"}`}>
                ₦{Number(lead.amount).toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Status specific banners */}
        {isOverdue && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl">
            <AlertCircle size={12} />
            Follow-up overdue
          </div>
        )}

        {lead.status === "paid" && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#2eb966] bg-green-50 px-3 py-1.5 rounded-xl">
            <CheckCircle2 size={12} />
            Payment confirmed
          </div>
        )}

        {lead.status === "lost" && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">
            <XCircle size={12} />
            Deal closed
          </div>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-gray-300">
            <Clock size={10} />
            {new Date(lead.created_at).toLocaleDateString("en-NG", {
              day: "numeric", month: "short",
            })}
          </div>

          {!isClosed && lead.phone && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={sendReminder}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-[11px] font-bold shadow-md shadow-green-200"
              style={{ background: "#25D366" }}
            >
              <MessageCircle size={12} />
              Remind
            </motion.button>
          )}
        </div>
      </motion.div>
    </Link>
  );
}