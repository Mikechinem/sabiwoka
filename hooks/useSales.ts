"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Exporting the Sale type so other files can use it
export type Sale = {
  id: string;
  user_id: string;
  lead_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  total_amount: number;
  amount_paid: number;
  balance: number;
  payment_status: "unpaid" | "partial" | "paid";
  invoice_image_url: string | null;
  input_method: "manual" | "invoice_scan" | "voice" | "magic_paste";
  notes: string | null;
  sold_at: string;
  created_at: string;
};

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]); // Use the Sale type here
  const [loading, setLoading] = useState(true);
  const [todayRevenue, setTodayRevenue] = useState(0); // STRICT SALES
  const [todayTotalCash, setTodayTotalCash] = useState(0); // SALES + DEBTS

  useEffect(() => {
    const supabase = createClient();

    async function fetchSales() {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("sold_at", { ascending: false });

      if (!error && data) {
        setSales(data as Sale[]);

        // --- THE MIDNIGHT RESET LOGIC ---
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Filter for any transaction that happened TODAY
        const todayData = data.filter((s) => {
          const saleDate = new Date(s.sold_at);
          return saleDate >= todayStart;
        });

        // 1. STRICT SALES (For Sales Page)
        // Only rows where total_amount > 0 (excludes debt recovery rows)
        const strictSales = todayData.filter((s) => Number(s.total_amount) > 0);
        const salesRevenue = strictSales.reduce((sum, s) => sum + Number(s.amount_paid), 0);
        
        // 2. TOTAL CASH (For Homepage Dashboard Card)
        // Everything paid today
        const totalCash = todayData.reduce((sum, s) => sum + Number(s.amount_paid), 0);

        setTodayRevenue(salesRevenue);
        setTodayTotalCash(totalCash);
      }
      setLoading(false);
    }

    fetchSales();

    const channel = supabase
      .channel("sales-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => {
        fetchSales();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { sales, loading, todayRevenue, todayTotalCash };
}