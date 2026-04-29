"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { processSyncQueue } from "@/lib/sync-engine";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      const handleOnline = async () => {
        setIsOnline(true);
        setShowBackOnline(true);
        
        // THE MAGIC: Trigger the sync immediately!
        await processSyncQueue();

        setTimeout(() => setShowBackOnline(false), 3000);
      };

      const handleOffline = () => {
        setIsOnline(false);
        setShowBackOnline(false); 
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    // 1. Safe check to ensure we only run this in the browser
    if (typeof window !== "undefined") {
      // Set initial status
      setIsOnline(navigator.onLine);

      // 2. Define what happens when connection is restored
      const handleOnline = () => {
        setIsOnline(true);
        setShowBackOnline(true);
        // Hide the "Back Online" success toast after 3 seconds
        setTimeout(() => setShowBackOnline(false), 3000);
      };

      // 3. Define what happens when connection drops
      const handleOffline = () => {
        setIsOnline(false);
        setShowBackOnline(false); 
      };

      // 4. Attach the listeners to the browser
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // 5. Cleanup listeners when component unmounts
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  return (
    <AnimatePresence>
      {/* OFFLINE STATE (Stays on screen until reconnected) */}
      {!isOnline && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          // Extremely high z-index to stay above all modals/drawers
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[999] bg-red-500 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 border-2 border-red-400"
        >
          <WifiOff size={16} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">
            You are offline
          </span>
        </motion.div>
      )}

      {/* BACK ONLINE STATE (Shows for 3 seconds, then vanishes) */}
      {isOnline && showBackOnline && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[999] bg-[#2eb966] text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 border-2 border-[#2eb966]/80"
        >
          <Wifi size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">
            Back Online
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}