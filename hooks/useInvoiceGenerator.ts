"use client";

import { useRef } from "react";
import { toPng } from "html-to-image";

export function useInvoiceGenerator() {
  const invoiceRef = useRef<HTMLDivElement>(null);

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

  return { invoiceRef, generateImage };
}