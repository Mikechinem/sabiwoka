"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trophy, TrendingUp, Package } from "lucide-react";

interface TopItem {
  product_name: string;
  total_sold: number;
  revenue: number;
}

export default function TopSellingItem() {
  const [topItem, setTopItem] = useState<TopItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getStats() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Logic: Fetch all sale items and manually group them 
      // (Supabase count/grouping is cleaner via RPC, but this works for smaller inventories)
      const { data: items } = await supabase
        .from("sale_items")
        .select("product_name, quantity, unit_price")
        .limit(100);

      if (items && items.length > 0) {
        const stats = items.reduce((acc: any, item) => {
          if (!acc[item.product_name]) {
            acc[item.product_name] = { total_sold: 0, revenue: 0 };
          }
          acc[item.product_name].total_sold += item.quantity;
          acc[item.product_name].revenue += item.quantity * item.unit_price;
          return acc;
        }, {});

        // Find the winner
        const winnerName = Object.keys(stats).reduce((a, b) => 
          stats[a].total_sold > stats[b].total_sold ? a : b
        );

        setTopItem({
          product_name: winnerName,
          total_sold: stats[winnerName].total_sold,
          revenue: stats[winnerName].revenue
        });
      }
      setLoading(false);
    }

    getStats();
  }, []);

  if (loading) return <div className="h-32 bg-gray-50 rounded-3xl animate-pulse" />;
  if (!topItem) return null;

  return (
    <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
      {/* Decorative Background Icon */}
      <Trophy className="absolute -right-2 -bottom-2 text-yellow-400/10 rotate-12" size={80} />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-yellow-100 p-2 rounded-xl text-yellow-600">
          <Trophy size={16} />
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Star Performer</p>
      </div>

      <h3 className="text-lg font-black text-gray-800 leading-tight mb-1">
        {topItem.product_name}
      </h3>
      
      <div className="flex items-center gap-4 mt-3">
        <div>
          <p className="text-[9px] font-bold text-gray-400 uppercase italic">Sold</p>
          <p className="text-sm font-black text-[#134e4a]">{topItem.total_sold} units</p>
        </div>
        <div className="h-8 w-[1px] bg-gray-100" />
        <div>
          <p className="text-[9px] font-bold text-gray-400 uppercase italic">Revenue</p>
          <p className="text-sm font-black text-[#134e4a]">₦{topItem.revenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded-lg">
        <TrendingUp size={12} />
        <span>Top of the charts</span>
      </div>
    </div>
  );
}