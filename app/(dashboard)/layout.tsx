"use client";

import { useState, useEffect } from "react";
import BottomNav from "@/components/shared/BottomNav";
import SettingsDrawer from "@/components/shared/SettingsDrawer";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Settings } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [userInitials, setUserInitials] = useState("??");

  // Fetch real vendor name on mount
  useEffect(() => {
    async function getProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        // Get name from metadata or split email if name isn't set
        const fullName = user.user_metadata?.full_name || user.email.split('@')[0];
        const initials = fullName
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        
        setUserInitials(initials);
      }
    }
    getProfile();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Universal Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 px-4 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#134e4a] flex items-center justify-center text-white shadow-sm">
            <span className="text-sm">✨</span>
          </div>
          <span className="font-black text-gray-900 tracking-tight text-lg">SabiWoka</span>
        </div>

        {/* The Settings Trigger with Gear Badge */}
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSettings(true)}
          className="relative group w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-all hover:border-[#134e4a]/30"
        >
          <span className="text-[11px] font-black text-[#134e4a] tracking-tighter">
            {userInitials}
          </span>

          {/* The Settings Badge Icon */}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#134e4a] rounded-full flex items-center justify-center border-2 border-white shadow-sm text-white">
            <Settings size={8} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
          </div>
        </motion.button>
      </header>

      {/* Main Content Area */}
      <main className="animate-in fade-in duration-500 pt-4">
        {children}
      </main>

      <BottomNav />

      <SettingsDrawer 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
}