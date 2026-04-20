"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Users, Clock, Sparkles, PenLine } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { createClient } from "@/lib/supabase/client";
import LeadCard from "@/components/leads/LeadCard";
import LeadVoiceRecorder from "@/components/leads/VoiceRecorder";
import MagicPasteBox from "@/components/leads/MagicPasteBox";

export default function LeadsPage() {
  const { activeLeads, closedLeads, loading } = useLeads();
  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    item_of_interest: "",
    amount: "",
    notes: "",
  });

  const currentLeads = activeTab === "active" ? activeLeads : closedLeads;

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAddLead() {
    if (!form.full_name) return;
    setSaving(true);
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase
      .from("leads")
      .insert({
        user_id: user.id,
        full_name: form.full_name,
        phone: form.phone || null,
        item_of_interest: form.item_of_interest || null,
        amount: parseFloat(form.amount || "0"),
        status: "interested",
        input_method: "manual",
        notes: form.notes || null,
      });

    if (!error) {
      setForm({ full_name: "", phone: "", item_of_interest: "", amount: "", notes: "" });
      setShowForm(false);
    }
    setSaving(false);
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28">
      {/* Header Section - Matches Sales Page Style */}
      <header className="relative mb-8 pt-4">
        <div className="absolute -top-2 -right-4 w-24 h-24 bg-[#134e4a]/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-[#134e4a] flex items-center justify-center text-white shadow-lg">
                <span className="text-lg">✨</span>
              </div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">SabiWoka</h1>
            </div>
            <p className="text-gray-500 font-medium text-sm">
               {activeLeads.length} active opportunities
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-white text-sm font-bold shadow-md bg-[#134e4a]"
          >
            <Plus size={16} /> Add Lead
          </motion.button>
        </div>
      </header>

      {/* Input Section - Logic Match with Sales Page */}
      <div className="mt-10 space-y-8 mb-12">
        <div className="px-1">
          <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-3">
            Quick Record (AI)
          </p>
          <LeadVoiceRecorder /> 
        </div>

        <div className="px-1">
          <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-3">
            Paste from WhatsApp
          </p>
          <MagicPasteBox />
        </div>
      </div>

      {/* Toggle Tabs - Identical Style to Sales Logic */}
      <div className="relative flex bg-gray-200/80 p-1.5 rounded-2xl mb-8 border border-gray-300/20 shadow-inner">
        {(["active", "closed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative z-10 flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === tab 
                ? "bg-white text-[#134e4a] shadow-md scale-[1.02]" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab} {tab === "active" ? `(${activeLeads.length})` : `(${closedLeads.length})`}
          </button>
        ))}
      </div>

      {/* Leads History Section */}
      <div className="mt-2">
        <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-4 px-1">
          {activeTab} Deals
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : currentLeads.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
            <Users size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">
              {activeTab === "active" ? "No active leads. Time to hustle! 🚀" : "No closed deals found."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {currentLeads.map((lead) => (
                <motion.div
                  key={lead.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <LeadCard lead={lead} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Manual Add Modal - Matches Sales Form Logic */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900">New Potential Deal</h2>
                <button onClick={() => setShowForm(false)}>
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { key: "full_name", label: "Customer Name *", placeholder: "e.g. Tunde Balogun", type: "text" },
                  { key: "phone", label: "WhatsApp Phone", placeholder: "080...", type: "tel" },
                  { key: "item_of_interest", label: "Item of Interest", placeholder: "e.g. 5 yards of silk", type: "text" },
                  { key: "amount", label: "Proposed Price (₦)", placeholder: "25000", type: "number" },
                  { key: "notes", label: "Extra Details", placeholder: "e.g. Meeting on Friday", type: "text" },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => updateForm(key, e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#134e4a]/10 transition-all"
                    />
                  </div>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddLead}
                disabled={!form.full_name || saving}
                className="w-full h-12 rounded-full text-white font-bold text-sm mt-5 disabled:opacity-50 shadow-lg"
                style={{ background: "#134e4a" }}
              >
                {saving ? "Saving..." : "Record Lead"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}