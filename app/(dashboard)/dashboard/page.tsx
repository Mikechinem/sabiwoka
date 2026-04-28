"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Wallet, Plus, Package, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import DynamicGreeting from "@/components/dashboard/DynamicGreeting";
import FollowUpAlert from "@/components/leads/FollowUpAlert";
import { useSales } from "@/hooks/useSales"; 

// NEW IMPORTS
import RevenueCard from "@/components/dashboard/RevenueCard";
import LeadCountCard from "@/components/dashboard/LeadCountCard";
import TopSellingItem from "@/components/dashboard/TopSellingItem";

export default function HomeDashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roi, setRoi] = useState(0);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  
  const { todaySales } = useSales(); 

  useEffect(() => {
    const supabase = createClient();

    async function fetchDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: leadsData } = await supabase
          .from("leads")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "interested")
          .order("intent_level", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(5);

        const { data: allPending } = await supabase
          .from("leads")
          .select("amount")
          .eq("user_id", user.id)
          .eq("status", "interested");

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
      .on("postgres_changes", { event: "*", schema: "public", table: "debts" }, fetchDashboardData)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads" }, fetchDashboardData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-50 max-w-md mx-auto px-4 pt-20 pb-32 overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden text-[#134e4a]">
        <span className="absolute -left-4 top-10 text-[7rem] font-bold italic opacity-[0.05] -rotate-12 leading-none" style={{ fontFamily: "Georgia, serif" }}>sabi</span>
        <span className="absolute -right-8 top-[40%] text-[7rem] font-bold italic opacity-[0.05] rotate-12 leading-none" style={{ fontFamily: "Georgia, serif" }}>woka</span>
      </div>

      <header className="mb-8">
        <DynamicGreeting />
        <FollowUpAlert />
      </header>

      <div className="relative z-10">
        {/* COMPONENT SWAP: REVENUE CARD */}
        <RevenueCard amount={todaySales} />

        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* COMPONENT SWAP: LEAD COUNT CARD */}
          <LeadCountCard count={leads.length} />

          <Link href="/debts" className="bg-white/90 p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Total Debt</p>
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
                    {lead.intent_level === "high" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />}
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shadow-sm border ${lead.intent_level === "high" ? "bg-green-50 border-green-100 text-green-700" : "bg-orange-50 border-orange-100 text-orange-600"}`}>
                        <span className="text-[10px] font-black uppercase leading-none">{lead.intent_level === "high" ? "High" : "Med"}</span>
                        <TrendingUp size={12} className="mt-1 opacity-70" />
                      </div>
                      <div>
                        <p className="text-[14px] font-black text-gray-900 leading-none mb-1.5">{lead.full_name}</p>
                        <p className="text-[11px] text-gray-400 font-medium italic">₦{Number(lead.amount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-2xl text-[#134e4a]"><ChevronRight size={18} /></div>
                  </motion.div>
                </Link>
              ))
            ) : (
              <div className="text-center py-10 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">No priority leads right now</p>
              </div>
            )}
            <Link href="/leads" className="flex justify-center py-2"><span className="text-[11px] font-bold text-[#134e4a] border-b border-[#134e4a] pb-0.5">View all leads</span></Link>
          </div>

          <div className="bg-[#1b1d2e] p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden mb-6">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-[#e1ae1b]" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e1ae1b]">Assistant Insight</p>
              </div>
              <p className="text-xs leading-relaxed text-gray-300 font-medium">You have <span className="text-white font-bold">₦{totalUnpaid.toLocaleString()}</span> in pending debts. Recovering these will significantly boost your profit.</p>
            </div>
          </div>

           <div className="mb-6">
            <TopSellingItem />
          </div>

          <Link href="/leads">
            <motion.div whileTap={{ scale: 0.98 }} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#134e4a]/10 rounded-2xl flex items-center justify-center text-[#134e4a]"><Package size={24} /></div>
                <div>
                  <p className="text-sm font-black text-gray-900 leading-tight">Add Customer</p>
                   <p className="text-[11px] text-gray-400 font-medium italic">Capture a new lead or walk-in customer</p>
                </div>
              </div>
              <div className="bg-[#134e4a] p-2 rounded-xl text-white shadow-lg"><Plus size={20} strokeWidth={3} /></div>
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  );
}