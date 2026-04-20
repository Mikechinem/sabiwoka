"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, LogOut, Store, Shield, Download, MessageCircle, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    onClose();
    router.refresh(); // This triggers the root page logic to send you to the landing page
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - dims the background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Side Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[85%] max-w-sm bg-white z-[70] shadow-2xl flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-6 flex items-center justify-between border-b border-gray-50">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Settings</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SabiWoka Profile</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Business Section */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Business</p>
                <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group">
                  <div className="w-12 h-12 rounded-xl bg-[#134e4a]/10 flex items-center justify-center text-[#134e4a] group-hover:scale-110 transition-transform">
                    <Store size={22} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-sm">Shop Profile</p>
                    <p className="text-xs text-gray-400">Edit business name</p>
                  </div>
                </button>
              </div>

              {/* Tools Section */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tools & Help</p>
                <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Download size={22} />
                  </div>
                  <p className="font-bold text-gray-900 text-sm">Export Data (CSV)</p>
                </button>
                <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                    <MessageCircle size={22} />
                  </div>
                  <p className="font-bold text-gray-900 text-sm">WhatsApp Support</p>
                </button>
              </div>
            </div>

            {/* Bottom Section - Logout */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-100"
              >
                <LogOut size={20} />
                <span className="font-black uppercase text-xs tracking-widest">Sign Out</span>
              </button>
              <p className="text-center text-[10px] text-gray-300 font-bold mt-4 tracking-tighter">
                SABIWOKA v1.0.4 • MADE FOR THE HUSTLE
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}