"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Wallet, MessageCircle, CheckCircle2, Clock, AlertCircle } from "lucide-react";

type Debt = {
  id: string;
  sale_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  total_amount: number;
  amount_paid: number;
  balance: number;
  is_settled: boolean;
  created_at: string;
  updated_at: string;
  reminder_count: number;
  last_reminder_sent_at: string | null;
};

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"outstanding" | "settled">("outstanding");
  const [settling, setSettling] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchDebts() {
      const { data, error } = await supabase
        .from("debts")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error && data) setDebts(data as Debt[]);
      setLoading(false);
    }

    fetchDebts();

    const channel = supabase
      .channel("debts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "debts" }, () => {
        fetchDebts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function settleDebt(debt: Debt) {
    setSettling(debt.id);
    const supabase = createClient();

    // 1 — Mark debt as settled and set amount_paid to full total
    await supabase
      .from("debts")
      .update({
        is_settled: true,
        amount_paid: debt.total_amount,
      })
      .eq("id", debt.id);

    // 2 — Update the linked sale to fully paid so revenue reflects correctly
    if (debt.sale_id) {
      await supabase
        .from("sales")
        .update({
          amount_paid: debt.total_amount,
          payment_status: "paid",
        })
        .eq("id", debt.sale_id);
    }

    setSettling(null);
  }

  async function sendReminder(debt: Debt) {
    if (!debt.customer_phone) return;
    const message = encodeURIComponent(
      `Hi ${debt.customer_name}, just a reminder that you have an outstanding balance of ₦${Number(debt.balance).toLocaleString()}. Kindly make payment at your earliest convenience. Thank you!`
    );
    const phone = debt.customer_phone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");

    const supabase = createClient();
    await supabase
      .from("debts")
      .update({
        reminder_count: debt.reminder_count + 1,
        last_reminder_sent_at: new Date().toISOString(),
      })
      .eq("id", debt.id);
  }

  const outstanding = debts.filter((d) => !d.is_settled);
  const settled = debts.filter((d) => d.is_settled);
  const displayed = tab === "outstanding" ? outstanding : settled;
  const totalOutstanding = outstanding.reduce((sum, d) => sum + Number(d.balance), 0);

  function daysSince(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-24 pb-28">
    <header className="relative mb-6 pt-2">
  <div className="relative z-10">
    {/* Small tag to categorize the page */}
    <p className="text-[10px] font-black text-[#134e4a] uppercase tracking-[0.2em] mb-1 ml-0.5">
      Debt Collection
    </p>

    {/* Scaled down title to stop competing with the Top Logo */}
    <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-2">
      Money Outside ⏳
    </h1>
    
    <div className="flex items-center gap-2 bg-red-50 w-fit px-3 py-1.5 rounded-xl border border-red-100">
      <p className="text-gray-500 font-bold text-[10px] uppercase tracking-wider">
        Total to collect:
      </p>
      <span className="text-base font-black text-red-600">
        ₦{totalOutstanding.toLocaleString()}
      </span>
    </div>
    
    {/* Supportive Subtext - kept clean */}
    <p className="text-[11px] text-[#134e4a] font-bold mt-3 italic opacity-80">
      {totalOutstanding > 0 
        ? "Time to follow up and bring that money home! 🏠" 
        : "Every kobo is accounted for. Great job! ✨"}
    </p>
  </div>
</header>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
        {(["outstanding", "settled"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: tab === t ? "white" : "transparent",
              color: tab === t ? "#134e4a" : "#9ca3af",
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {t === "outstanding"
              ? `Outstanding (${outstanding.length})`
              : `Settled (${settled.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
          <Wallet size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {tab === "outstanding"
              ? "No outstanding debts. All clear!"
              : "No settled debts yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {displayed.map((debt) => {
              const days = daysSince(debt.created_at);
              const isUrgent = days >= 7 && !debt.is_settled;

              return (
                <motion.div
                  key={debt.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">
                        {debt.customer_name}
                      </h3>
                      {debt.customer_phone && (
                        <p className="text-xs text-gray-400">{debt.customer_phone}</p>
                      )}
                    </div>
                    {debt.is_settled ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-[#2eb966] bg-green-50">
                        Settled
                      </span>
                    ) : isUrgent ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-red-500 bg-red-50 flex items-center gap-1">
                        <AlertCircle size={10} /> Overdue
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-amber-600 bg-amber-50">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <div>
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="font-bold text-gray-900">
                        ₦{Number(debt.total_amount).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Paid</p>
                      <p className="font-bold" style={{ color: "#2eb966" }}>
                        ₦{Number(debt.amount_paid).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Balance</p>
                      <p className="font-bold text-red-500">
                        ₦{Number(debt.balance).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-300 mb-3">
                    <Clock size={10} />
                    {days === 0 ? "Today" : `${days} day${days > 1 ? "s" : ""} ago`}
                    {debt.reminder_count > 0 && (
                      <span className="ml-auto text-gray-300">
                        {debt.reminder_count} reminder{debt.reminder_count > 1 ? "s" : ""} sent
                      </span>
                    )}
                  </div>

                  {!debt.is_settled && (
                    <div className="flex gap-2">
                      {debt.customer_phone && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => sendReminder(debt)}
                          className="flex-1 h-10 rounded-full text-white text-xs font-bold flex items-center justify-center gap-1.5"
                          style={{ background: "#25D366" }}
                        >
                          <MessageCircle size={14} /> Remind
                        </motion.button>
                      )}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => settleDebt(debt)}
                        disabled={settling === debt.id}
                        className="flex-1 h-10 rounded-full text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
                        style={{ background: "#134e4a" }}
                      >
                        <CheckCircle2 size={14} />
                        {settling === debt.id ? "Settling..." : "Mark Settled"}
                      </motion.button>
                    </div>
                  )}

                  {debt.is_settled && (
                    <div
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl"
                      style={{ color: "#2eb966", background: "#f0fdf4" }}
                    >
                      <CheckCircle2 size={12} />
                      Settled on{" "}
                      {new Date(debt.updated_at).toLocaleDateString("en-NG", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}