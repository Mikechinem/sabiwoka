"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// THE FIX: Explicitly defining and exporting the Sale type
export type Sale = {
  id: string;
  user_id: string;
  customer_name: string | null;
  total_amount: number;
  amount_paid: number;
  payment_status: "unpaid" | "partial" | "paid";
  sold_at: string;
  // This handles the relationship with your sale_items table
  sale_items?: { product_name: string }[];
};

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayRevenue, setTodayRevenue] = useState(0); 
  const [todayTotalCash, setTodayTotalCash] = useState(0); 

  useEffect(() => {
    const supabase = createClient();

    async function fetchSales() {
      // Fetching sales and joining the product_name from sale_items
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          sale_items (product_name)
        `)
        .order("sold_at", { ascending: false });

      if (!error && data) {
        setSales(data as Sale[]);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Filter transactions for today
        const todayData = data.filter((s) => new Date(s.sold_at) >= todayStart);

        // 1. Calculate Strict Sales Revenue (New sales today)
        const salesRevenue = todayData.reduce((sum, s) => sum + Number(s.amount_paid), 0);
        
        // 2. Total Cash (In the future, if you track debt payments in this table, 
        // you would add that logic here. For now, it matches revenue)
        const totalCash = todayData.reduce((sum, s) => sum + Number(s.amount_paid), 0);

        setTodayRevenue(salesRevenue);
        setTodayTotalCash(totalCash);
      }
      setLoading(false);
    }

    fetchSales();
    
    const channel = supabase.channel("sales-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => fetchSales())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { sales, loading, todayRevenue, todayTotalCash };
}