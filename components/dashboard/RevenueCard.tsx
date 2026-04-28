import { motion } from "framer-motion";
import Link from "next/link";

interface RevenueCardProps {
  amount: number;
}

export default function RevenueCard({ amount }: RevenueCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#134e4a] rounded-[2.5rem] p-7 text-white mb-6 shadow-2xl relative overflow-hidden"
    >
      <div className="relative z-10">
        <p className="text-teal-100/70 text-[10px] font-bold uppercase tracking-[0.2em]">
          Revenue (Sales + Debts Recovered)
        </p>
        <h2 className="text-4xl font-black mt-1 mb-5">
          ₦{(amount || 0).toLocaleString()}
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-teal-200 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span>Today's Cashflow</span>
          </div>
          <Link href="/sales">
            <div className="bg-white rounded-full px-5 py-2.5 text-[#134e4a] text-xs font-black shadow-lg">
              + New Sale
            </div>
          </Link>
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
    </motion.div>
  );
}