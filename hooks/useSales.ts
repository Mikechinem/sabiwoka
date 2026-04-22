"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Sale = {
  id: string;
  user_id: string;
  lead_id: string | null;
  customer_name: string | null;
  total_amount: number;
  amount_paid: number;
  payment_status: "unpaid" | "partial" | "paid";
  sold_at: string;
  sale_items?: { product_name: string }[];
};

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayRevenue, setTodayRevenue] = useState(0); 
  const [todaySales, setTodaySales] = useState(0); 
  const [todayTotalCash, setTodayTotalCash] = useState(0); 

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayIso = todayStart.toISOString();

        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select(`*, sale_items (product_name)`)
          .eq("user_id", user.id)
          .order("sold_at", { ascending: false });

        const { data: debtData } = await supabase
          .from("debts")
          .select("amount_paid, updated_at, created_at")
          .eq("user_id", user.id)
          .gte("updated_at", todayIso);

        if (!salesError && salesData) {
          setSales(salesData as Sale[]);

          const todaySalesData = salesData.filter((s) => new Date(s.sold_at) >= todayStart);
          const salesVolume = todaySalesData.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
          const pureSalesCash = todaySalesData.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0);

          const debtRecovered = debtData?.reduce((sum, d) => {
            const isNewDebtFromToday = new Date(d.created_at) >= todayStart;
            if (isNewDebtFromToday) return sum; 
            return sum + Number(d.amount_paid || 0);
          }, 0) || 0;

          setTodayRevenue(salesVolume);
          setTodaySales(pureSalesCash);
          setTodayTotalCash(pureSalesCash + debtRecovered);
        }
      } catch (err) {
        console.error("Error fetching financial data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    
    const salesChannel = supabase.channel("realtime-finance")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "debts" }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(salesChannel); };
  }, []);

  return { sales, loading, todayRevenue, todaySales, todayTotalCash };
}