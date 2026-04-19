"use client";

import { LeadStatus, IntentLevel } from "@/types/lead";

interface Props {
  status?: LeadStatus;
  intent?: IntentLevel;
}

export default function LeadStatusBadge({ status, intent }: Props) {
  // Color mapping based on your brand palette
  const intentColors = {
    high: "bg-[#2eb966]/10 text-[#2eb966] border-[#2eb966]/20", // Brand Green for High Intent
    medium: "bg-[#e1ae1b]/10 text-[#e1ae1b] border-[#e1ae1b]/20", // Brand Gold for Medium
    low: "bg-gray-100 text-gray-500 border-gray-200",
  };

  if (intent) {
    return (
      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${intentColors[intent]}`}>
        {intent} Intent
      </span>
    );
  }

  return (
    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
      {status}
    </span>
  );
}