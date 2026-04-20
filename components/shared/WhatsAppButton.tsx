"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  phone: string;
  message: string;
  label?: string;
  loading?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export default function WhatsAppButton({ 
  phone, 
  message, 
  label = "Message", 
  loading = false, 
  onClick,
  className 
}: WhatsAppButtonProps) {
  
  const handleLaunch = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e); // If we are using AI to generate the message first
      return;
    }

    // Default behavior: just open the link
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={handleLaunch}
      disabled={loading}
      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-white text-[11px] font-black shadow-lg transition-all disabled:opacity-70 ${className}`}
      style={{ background: "linear-gradient(135deg, #134e4a 0%, #25D366 100%)" }}
    >
      <MessageCircle size={12} />
      {loading ? "Sabin..." : label}
    </motion.button>
  );
}