"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Wallet, Plus, Package, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import DynamicGreeting from "@/components/dashboard/DynamicGreeting";

export default function HomeDashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roi, setRoi] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalUnpaid, setTotalUnpaid] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    async function fetchDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Revenue from today only — resets at midnight same as sales/page
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: recentSales } = await supabase
          .from("sales")
          .select("amount_paid, payment_status")
          .eq("user_id", user.id)
          .gte("sold_at", todayStart.toISOString());

        const revenue = recentSales
          ?.filter((s) => s.payment_status !== "unpaid")
          .reduce((sum, s) => sum + Number(s.amount_paid), 0) || 0;
        setTotalRevenue(revenue);

        // Priority leads
        const { data: leadsData } = await supabase
          .from("leads")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "interested")
          .order("intent_level", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(5);

        // ROI waiting
        const { data: allPending } = await supabase
          .from("leads")
          .select("amount")
          .eq("user_id", user.id)
          .eq("status", "interested");

        // Unpaid debts
        const { data: debtRecords } = await supabase
          .from("debts")
          .select("balance")
          .eq("user_id", user.id)
          .eq("is_settled", false);

        if (leadsData) setLeads(leadsData);
        setRoi(allPending?.reduce((sum, l) => sum + Number(l.amount || 0), 0) || 0);
        setTotalUnpaid(debtRecords?.reduce((sum, d) => sum + Number(d.balance || 0), 0) || 0);

      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();

    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, fetchDashboardData)
      .on("postgres_changes", { event: "*", schema: "public", table: "debts" }, fetchDashboardData)
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, fetchDashboardData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-50 max-w-md mx-auto px-4 pt-8 pb-32 overflow-hidden font-sans">

      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden text-[#134e4a]">
        <span className="absolute -left-4 top-10 text-[7rem] font-bold italic opacity-[0.05] -rotate-12 leading-none" style={{ fontFamily: "Georgia, serif" }}>sabi</span>
        <span className="absolute -right-8 top-[40%] text-[7rem] font-bold italic opacity-[0.05] rotate-12 leading-none" style={{ fontFamily: "Georgia, serif" }}>woka</span>
      </div>

      <header className="mb-8">
        <DynamicGreeting />
      </header>

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#134e4a] rounded-[2.5rem] p-7 text-white mb-6 shadow-2xl relative overflow-hidden"
        >
          <div className="relative z-10">
            <p className="text-teal-100/70 text-[10px] font-bold uppercase tracking-[0.2em]">
             (Today Sales + Debt Recovered)
            </p>
            <h2 className="text-4xl font-black mt-1 mb-5">
              ₦{totalRevenue.toLocaleString()}
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-200 text-[11px] font-semibold">
                <TrendingUp size={14} />
                <span>Resets at midnight</span>
              </div>
              <Link href="/sales/new">
                <div className="bg-white rounded-full px-5 py-2.5 text-[#134e4a] text-xs font-black shadow-lg">
                  + New Sale
                </div>
              </Link>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        </motion.div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link href="/leads" className="bg-white/90 p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 bg-[#e1ae1b]/10 rounded-2xl flex items-center justify-center text-[#e1ae1b]">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Customer pipeline</p>
              <p className="text-xl font-bold text-gray-900">{leads.length}</p>
            </div>
          </Link>
          <Link href="/debts" className="bg-white/90 p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Unpaid</p>
              <p className="text-xl font-bold text-red-600">₦{totalUnpaid.toLocaleString()}</p>
            </div>
          </Link>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="font-bold text-gray-800 text-sm tracking-tight">Priority Follow-ups</h3>
            <span className="text-[10px] bg-green-100 text-green-700 px-3 py-1 rounded-full font-black uppercase tracking-widest">
              ₦{roi.toLocaleString()} waiting
            </span>
          </div>

          <div className="space-y-4 mb-6">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-[#134e4a]" />
              </div>
            ) : leads.length > 0 ? (
              leads.map((lead) => (
                <Link href={`/leads/${lead.id}`} key={lead.id} className="block">
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="bg-white p-5 rounded-[2.2rem] shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden"
                  >
                    {lead.intent_level === "high" && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                    )}
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shadow-sm border ${
                        lead.intent_level === "high"
                          ? "bg-green-50 border-green-100 text-green-700"
                          : "bg-orange-50 border-orange-100 text-orange-600"
                      }`}>
                        <span className="text-[10px] font-black uppercase leading-none">
                          {lead.intent_level === "high" ? "High" : "Med"}
                        </span>
                        <TrendingUp size={12} className="mt-1 opacity-70" />
                      </div>
                      <div>
                        <p className="text-[14px] font-black text-gray-900 leading-none mb-1.5">
                          {lead.full_name}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium italic">
                          ₦{Number(lead.amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-2xl text-[#134e4a]">
                      <ChevronRight size={18} />
                    </div>
                  </motion.div>
                </Link>
              ))
            ) : (
              <div className="text-center py-10 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                  No priority leads right now
                </p>
              </div>
            )}

            <Link href="/leads" className="flex justify-center py-2">
              <span className="text-[11px] font-bold text-[#134e4a] border-b border-[#134e4a] pb-0.5">
                View all leads
              </span>
            </Link>
          </div>

          <div className="bg-[#1b1d2e] p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden mb-6">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-[#e1ae1b]" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e1ae1b]">
                  Assistant Insight
                </p>
              </div>
              <p className="text-xs leading-relaxed text-gray-300 font-medium">
                You have{" "}
                <span className="text-white font-bold">₦{totalUnpaid.toLocaleString()}</span>{" "}
                in pending debts. Recovering these will significantly boost your profit.
              </p>
            </div>
          </div>

          <Link href="/inventory">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#134e4a]/10 rounded-2xl flex items-center justify-center text-[#134e4a]">
                  <Package size={24} />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 leading-tight">Manage Inventory</p>
                  <p className="text-[11px] text-gray-400 font-medium italic">
                    Restock items and monitor your supply
                  </p>
                </div>
              </div>
              <div className="bg-[#134e4a] p-2 rounded-xl text-white shadow-lg">
                <Plus size={20} strokeWidth={3} />
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  );
}