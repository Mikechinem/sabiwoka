"use client";

import { ShieldAlert, AlertTriangle, ShieldCheck, Info, RefreshCw, X, User, Calendar, Hash, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface FakeAlertProps {
  result: {
    amount?: number | null;
    bankName?: string | null;
    sender?: string | null;
    recipient?: string | null;
    date?: string | null;
    reference?: string | null;
    verdict?: "REAL" | "SUSPICIOUS" | "LIKELY_FAKE";
    isFakeProbability?: number;
    redFlags?: string[];
    rawTextSummary?: string | null;
  };
  onReset: () => void;
}

export default function FakeAlertResult({ result, onReset }: FakeAlertProps) {
  const verdict = result?.verdict || "SUSPICIOUS";
  const probability = result?.isFakeProbability ?? 50;
  const flags = result?.redFlags || [];
  const amount = result?.amount ?? null;
  const bank = result?.bankName ?? null;
  const sender = result?.sender ?? null;
  const recipient = result?.recipient ?? null;
  const date = result?.date ?? null;
  const reference = result?.reference ?? null;
  const summary = result?.rawTextSummary ?? null;

  const isDanger = verdict === "LIKELY_FAKE" || probability > 70;
  const isClean = verdict === "REAL" && probability < 30;

  const theme = isDanger
    ? {
        bg: "bg-red-50", border: "border-red-200",
        accent: "bg-red-500", text: "text-red-700",
        bar: "bg-red-500", btn: "bg-red-600",
        icon: <ShieldAlert size={24} />,
        label: "Likely Fake",
      }
    : isClean
    ? {
        bg: "bg-green-50", border: "border-green-200",
        accent: "bg-green-500", text: "text-green-700",
        bar: "bg-green-500", btn: "bg-green-600",
        icon: <ShieldCheck size={24} />,
        label: "Looks Real",
      }
    : {
        bg: "bg-amber-50", border: "border-amber-200",
        accent: "bg-amber-500", text: "text-amber-700",
        bar: "bg-amber-500", btn: "bg-amber-600",
        icon: <AlertTriangle size={24} />,
        label: "Suspicious",
      };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`rounded-[2.5rem] p-6 border-2 overflow-hidden relative shadow-2xl ${theme.bg} ${theme.border} max-w-md mx-auto`}
    >
      {/* Background Icon Watermark */}
      <div className={`absolute -right-6 -bottom-6 opacity-[0.05] ${theme.text} pointer-events-none`}>
        {theme.icon}
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${theme.accent} text-white shadow-lg`}>
            {theme.icon}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Sabi Auditor</p>
            <h3 className={`text-xl font-black leading-none ${theme.text}`}>{theme.label}</h3>
          </div>
        </div>
        <button onClick={onReset} className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      <div className="space-y-4 relative z-10">
        
        {/* Risk Bar Section */}
        <div className="bg-white/60 backdrop-blur-md p-4 rounded-[1.8rem] border border-white/50">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Security Score</span>
            <span className={`text-lg font-black ${theme.text}`}>{probability}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-200/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${probability}%` }}
              className={`h-full ${theme.bar}`}
            />
          </div>
        </div>

        {/* Amount & Bank Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/50 p-4 rounded-2xl border border-white/50">
            <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Amount</p>
            <p className="text-base font-black text-gray-900">
              {amount !== null ? `₦${Number(amount).toLocaleString()}` : "—"}
            </p>
          </div>
          <div className="bg-white/50 p-4 rounded-2xl border border-white/50">
            <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Bank</p>
            <p className="text-base font-black text-gray-900 truncate">
              {bank ?? "Unknown"}
            </p>
          </div>
        </div>

        {/* Detailed Info - Improved Alignment */}
        {(sender || recipient || date || reference) && (
          <div className="bg-white/70 p-5 rounded-[2rem] border border-white space-y-3 shadow-sm">
            {[
              { icon: <User size={14} />, label: "Sender", value: sender },
              { icon: <User size={14} />, label: "Recipient", value: recipient },
              { icon: <Calendar size={14} />, label: "Date", value: date },
              { icon: <Hash size={14} />, label: "Ref", value: reference },
            ].map((item, idx) => item.value && (
              <div key={idx} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 opacity-40">
                  {item.icon}
                  <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                </div>
                <p className="text-[13px] font-bold text-gray-800 pl-5 break-words">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* AI Summary Section */}
        {summary && (
          <div className="bg-white/40 p-4 rounded-2xl border border-white/40 flex items-start gap-3">
            <FileText size={16} className="text-gray-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-600 font-medium leading-relaxed italic">
              "{summary}"
            </p>
          </div>
        )}

        {/* Red Flags / Issues Section */}
        {flags.length > 0 && (
          <div className="bg-white/90 p-5 rounded-[2rem] border border-red-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Info size={14} className="text-red-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Analysis Notes</p>
            </div>
            <ul className="space-y-2">
              {flags.map((flag, i) => (
                <li key={i} className="text-[11px] font-bold text-gray-700 flex items-start gap-2.5">
                  <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${theme.bar}`} />
                  <span className="leading-tight">{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Final CTA Button */}
        <button
          onClick={onReset}
          className={`w-full py-4 mt-2 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 hover:brightness-110 text-white ${theme.btn}`}
        >
          <RefreshCw size={14} /> Scan New Receipt
        </button>
      </div>
    </motion.div>
  );
}