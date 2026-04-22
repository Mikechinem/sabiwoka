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
      className={`rounded-[2.5rem] p-7 border-2 overflow-hidden relative shadow-2xl ${theme.bg} ${theme.border}`}
    >
      <div className="absolute -right-4 -bottom-4 opacity-[0.05] text-red-900 pointer-events-none">
        <ShieldAlert size={150} />
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${theme.accent} text-white`}>
            {theme.icon}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
              Sabi Analysis
            </p>
            <h3 className={`text-xl font-black leading-none ${theme.text}`}>
              {theme.label}
            </h3>
          </div>
        </div>
        <button onClick={onReset} className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      <div className="space-y-4 relative z-10">

        {/* AI Summary — plain English */}
        {summary && (
          <div className="bg-white/70 p-4 rounded-2xl border border-white flex items-start gap-2">
            <FileText size={13} className="text-gray-400 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-700 font-medium leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Risk bar */}
        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-black uppercase text-gray-400">Risk Level</span>
            <span className={`text-lg font-black ${theme.text}`}>{probability}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${probability}%` }}
              className={`h-full ${theme.bar}`}
            />
          </div>
          <p className="text-[9px] text-gray-400 mt-1.5 font-medium">
            {probability < 30
              ? "Low risk — payment appears genuine"
              : probability < 70
              ? "Medium risk — verify with your bank app"
              : "High risk — do not accept this payment"}
          </p>
        </div>

        {/* Amount and Bank — only show if found */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/40 p-4 rounded-2xl">
            <p className="text-[9px] font-black text-gray-400 uppercase">Amount</p>
            <p className="text-sm font-black text-gray-800">
              {amount !== null ? `₦${Number(amount).toLocaleString()}` : "Not found"}
            </p>
          </div>
          <div className="bg-white/40 p-4 rounded-2xl">
            <p className="text-[9px] font-black text-gray-400 uppercase">Bank</p>
            <p className="text-sm font-black text-gray-800 truncate">
              {bank ?? "Not found"}
            </p>
          </div>
        </div>

        {/* Sender, recipient, date, reference */}
        {(sender || recipient || date || reference) && (
          <div className="bg-white/60 p-4 rounded-2xl border border-white space-y-2">
            {sender && (
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <User size={12} className="text-gray-400 shrink-0" />
                <span className="text-gray-400 font-bold uppercase text-[9px] w-16 shrink-0">Sender</span>
                <span className="font-bold truncate">{sender}</span>
              </div>
            )}
            {recipient && (
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <User size={12} className="text-gray-400 shrink-0" />
                <span className="text-gray-400 font-bold uppercase text-[9px] w-16 shrink-0">Recipient</span>
                <span className="font-bold truncate">{recipient}</span>
              </div>
            )}
            {date && (
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Calendar size={12} className="text-gray-400 shrink-0" />
                <span className="text-gray-400 font-bold uppercase text-[9px] w-16 shrink-0">Date</span>
                <span className="font-bold">{date}</span>
              </div>
            )}
            {reference && (
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Hash size={12} className="text-gray-400 shrink-0" />
                <span className="text-gray-400 font-bold uppercase text-[9px] w-16 shrink-0">Ref</span>
                <span className="font-bold truncate">{reference}</span>
              </div>
            )}
          </div>
        )}

        {/* Red flags */}
        {flags.length > 0 && (
          <div className="bg-white/80 p-5 rounded-[1.8rem] border border-white shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-gray-500">
              <Info size={14} />
              <p className="text-[10px] font-black uppercase tracking-widest">
                Issues Found
              </p>
            </div>
            <ul className="space-y-2">
              {flags.map((flag, i) => (
                <li
                  key={i}
                  className="text-[11px] font-bold text-gray-700 flex items-start gap-2 leading-tight"
                >
                  <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${theme.bar}`} />
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Clean result */}
        {isClean && flags.length === 0 && (
          <div className="bg-white/80 p-4 rounded-2xl border border-green-100 text-center">
            <p className="text-xs font-bold text-green-600">
              No red flags detected. This receipt appears legitimate. Always confirm in your bank app to be 100% sure.
            </p>
          </div>
        )}

        <button
          onClick={onReset}
          className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 text-white ${theme.btn}`}
        >
          <RefreshCw size={14} /> Scan Another Receipt
        </button>
      </div>
    </motion.div>
  );
}