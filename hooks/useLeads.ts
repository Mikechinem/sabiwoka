"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  item_of_interest: string | null;
  amount: number | null;
  status: "new" | "contacted" | "interested" | "paid" | "lost";
  intent_level: "low" | "medium" | "high";
  notes: string | null;
  whatsapp_url: string | null;
  created_at: string;
  updated_at: string; // Added this for better sorting in 'Closed'
  follow_up_due_at: string | null;
};

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setLeads(data as Lead[]);
    setLoading(false);
  };

  useEffect(() => {
    const supabase = createClient();
    fetchLeads();

    const channel = supabase
      .channel("leads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        fetchLeads();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- NEW FILTERING LOGIC ---

  const activeLeads = useMemo(() => 
    leads.filter(lead => ['new', 'contacted', 'interested'].includes(lead.status)), 
    [leads]
  );

  const closedLeads = useMemo(() => 
    leads.filter(lead => ['paid', 'lost'].includes(lead.status)), 
    [leads]
  );

  return { 
    leads,        // All leads (if you still need them)
    activeLeads,  // The "Hustle" list
    closedLeads,  // The "History" list
    loading 
  };
}