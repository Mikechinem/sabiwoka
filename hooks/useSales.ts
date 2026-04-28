"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Sale {
  id: string;
  customer_name: string;
  customer_phone?: string;
  total_amount: number;
  amount_paid: number;
  payment_status: string;
  sold_at: string;
  input_method?: string;
  lead_id?: string;
  // Included for Inventory and Receipt logic
  sale_items?: { 
    id: string;
    product_name: string; 
    quantity: number; 
    unit_price: number; 
  }[]; 
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [todaySales, setTodaySales] = useState(0); 
  const [todayNewSalesCash, setTodayNewSalesCash] = useState(0);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();

      // Fetch Sales JOINED with sale_items
      const { data: salesData } = await supabase
        .from("sales")
        .select(`
          *,
          sale_items (
            id,
            product_name,
            quantity,
            unit_price
          )
        `)
        .eq("user_id", user.id)
        .order("sold_at", { ascending: false });

      const { data: recoveredDebts } = await supabase
        .from("debts")
        .select("amount_paid, updated_at")
        .eq("user_id", user.id)
        .eq("is_settled", true)
        .gte("updated_at", todayISO);

      if (salesData) {
        setSales(salesData as Sale[]);

        const directSalesCash = salesData
          .filter(s => new Date(s.sold_at) >= todayStart)
          .reduce((sum, s) => sum + Number(s.amount_paid || 0), 0);

        const recoveryCash = recoveredDebts
          ?.reduce((sum, d) => sum + Number(d.amount_paid || 0), 0) || 0;

        setTodayNewSalesCash(directSalesCash);
        setTodaySales(directSalesCash + recoveryCash);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
    
    const channel = supabase.channel("realtime-sales")
      // 1. On New Sale: Fetch to guarantee we get the nested sale_items joined properly
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sales" }, () => {
        fetchData();
      })
      // 2. On Delete: Instantly filter the UI for a snappy feel, then fetch in background for math totals
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "sales" }, (payload) => {
        setSales((prev) => prev.filter((s) => s.id !== payload.old.id));
        fetchData();
      })
      // 3. Keep existing listener for sale_items changes
      .on("postgres_changes", { event: "*", schema: "public", table: "sale_items" }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData, supabase]);

  return { sales, loading, todaySales, todayNewSalesCash, refresh: fetchData };
}