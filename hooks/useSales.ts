"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
  input_method: "manual" | "invoice_scan" | "voice";
  notes: string | null;
  sold_at: string;
  created_at: string;
};

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayRevenue, setTodayRevenue] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    async function fetchSales() {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("sold_at", { ascending: false });

      if (!error && data) {
        setSales(data as Sale[]);

        const today = new Date().toISOString().split("T")[0];
        const todaySales = data.filter((s) =>
          s.sold_at.startsWith(today) && s.payment_status !== "unpaid"
        );
        const revenue = todaySales.reduce(
          (sum, s) => sum + Number(s.amount_paid), 0
        );
        setTodayRevenue(revenue);
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

  return { sales, loading, todayRevenue };
}