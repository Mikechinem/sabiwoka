"use client";

import { useState } from "react";
import MagicPasteBox from "@/components/leads/MagicPasteBox";
import LeadCard from "@/components/leads/LeadCard";
import { useLeads } from "@/hooks/useLeads";
import { motion, AnimatePresence } from "framer-motion";

export default function LeadsPage() {
  // 1. Get filtered lists from our updated hook
  const { activeLeads, closedLeads, loading } = useLeads();
  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");

  const currentLeads = activeTab === "active" ? activeLeads : closedLeads;

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-6">
      <header className="relative mb-8 pt-4">
  {/* Subtle Background "Character" - A soft, calming glow */}
  <div className="absolute -top-2 -right-4 w-24 h-24 bg-[#134e4a]/5 rounded-full blur-3xl" />
  <div className="absolute top-10 -left-10 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl" />

  <div className="relative z-10">
    <div className="flex items-center gap-2 mb-1">
       {/* Friendly Icon */}
       <div className="w-8 h-8 rounded-full bg-[#134e4a] flex items-center justify-center text-white shadow-lg">
          <span className="text-lg">✨</span>
       </div>
       <h1 className="text-2xl font-black text-gray-900 tracking-tight">
         SabiWoka
       </h1>
    </div>
    <p className="text-gray-500 font-medium leading-tight">
      <span className="text-[#134e4a]/70 text-sm">Let’s turn these chats into cash...</span>
    </p>
  </div>
</header>

      {/* Feature 1: The Magic Paste Box */}
      <section className="mb-8">
        <MagicPasteBox />
      </section>

      {/* Feature 2: The Physical Switch Toggle */}
      <div className="relative flex bg-gray-200/80 p-1.5 rounded-2xl mb-8 border border-gray-300/20 shadow-inner">
        <button
          onClick={() => setActiveTab("active")}
          className={`relative z-10 flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
            activeTab === "active" 
              ? "bg-white text-[#134e4a] shadow-[0_4px_12px_rgba(0,0,0,0.12)] scale-[1.02]" 
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Active {activeLeads.length > 0 && <span className="ml-1 opacity-50">({activeLeads.length})</span>}
        </button>
        
        <button
          onClick={() => setActiveTab("closed")}
          className={`relative z-10 flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
            activeTab === "closed" 
              ? "bg-white text-[#134e4a] shadow-[0_4px_12px_rgba(0,0,0,0.12)] scale-[1.02]" 
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Closed {closedLeads.length > 0 && <span className="ml-1 opacity-50">({closedLeads.length})</span>}
        </button>
      </div>

      {/* Feature 3: The Filtered Lead List */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
            {activeTab} Deals
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : currentLeads.length > 0 ? (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {currentLeads.map((lead) => (
                <motion.div
                  key={lead.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <LeadCard lead={lead} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm font-medium">
              {activeTab === "active" 
                ? "No active leads. Time to hustle! 🚀" 
                : "Your history is empty. Close some deals! 💰"}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}