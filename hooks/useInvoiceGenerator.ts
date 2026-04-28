"use client";

import { useRef, useState, useEffect } from "react";
import { toPng } from "html-to-image";
import { createClient } from "@/lib/supabase/client";

export interface BusinessProfile {
  business_name?: string;
  phone?: string;
  business_address?: string;
  logo_url?: string;
}

export function useInvoiceGenerator() {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  // Fetch the business profile so it's ready for the receipt
  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("business_name, phone, business_address, logo_url")
          .eq("id", user.id)
          .single();
        
        if (data) setProfile(data);
      }
    }
    fetchProfile();
  }, []);

  const generateImage = async (customerName: string) => {
    if (!invoiceRef.current) return null;

    try {
      const dataUrl = await toPng(invoiceRef.current, {
        quality: 0.95,
        cacheBust: true,
      });

      // Create a temporary link to download
      const link = document.createElement("a");
      link.download = `Receipt-${customerName.replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
      
      return dataUrl;
    } catch (err) {
      console.error("Failed to generate invoice image", err);
      return null;
    }
  };

  return { invoiceRef, generateImage, profile };
}