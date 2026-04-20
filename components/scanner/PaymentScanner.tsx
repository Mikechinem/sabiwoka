"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, Camera, Cpu } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PaymentScanner() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#134e4a] flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      
      {/* Aesthetic Background Branding */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none opacity-[0.03]">
        <span className="absolute -left-10 top-10 text-[12rem] font-black italic -rotate-12 leading-none">
          sabi
        </span>
        <span className="absolute -right-10 bottom-10 text-[12rem] font-black italic rotate-12 leading-none">
          woka
        </span>
      </div>

      <div className="relative z-10 text-center max-w-xs">
        <motion.div 
          initial={{ scale: 0, rotate: -180 }} 
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-white/20 shadow-2xl"
        >
          <div className="relative">
            <Camera size={40} className="text-white/20" />
            <Sparkles className="text-[#e1ae1b] absolute -top-2 -right-2 animate-pulse" size={32} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl font-black mb-3 tracking-tight">AI Scanner</h1>
          <div className="inline-flex items-center gap-2 bg-[#e1ae1b]/20 px-3 py-1 rounded-full mb-6 border border-[#e1ae1b]/30">
            <Cpu size={12} className="text-[#e1ae1b]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#e1ae1b]">
              Coming Soon
            </span>
          </div>
          
          <p className="text-sm text-teal-100/60 font-medium mb-10 leading-relaxed">
            We're building a "Magic Scanner" that automatically records sales and updates your inventory by just looking at a receipt.
          </p>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className="w-full py-4 bg-white text-[#134e4a] rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </motion.button>
        </motion.div>
      </div>

      {/* Progress Footer */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1 rounded-full ${i === 3 ? 'w-8 bg-[#e1ae1b]' : 'w-2 bg-white/20'}`} />
        ))}
      </div>
    </div>
  );
}