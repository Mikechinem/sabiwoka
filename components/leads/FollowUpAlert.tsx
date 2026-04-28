"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BellRing, ChevronRight, PhoneForwarded } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function FollowUpAlert() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkFollowUps() {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];

      const { count: followUpCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .not("status", "eq", "paid") // Don't follow up with people who already paid
        .lte("follow_up_date", today); // Follow up date is today or passed

      setCount(followUpCount || 0);
      setLoading(false);
    }

    checkFollowUps();
  }, []);

  if (loading || count === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Link href="/leads?filter=followup">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2.5 rounded-xl text-white shadow-amber-200 shadow-lg">
                <BellRing size={20} className="animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-900">
                  {count} Follow-ups Pending
                </h3>
                <p className="text-[11px] text-amber-700 font-medium">
                  Don't let these customers go cold!
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-amber-400" />
          </div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}