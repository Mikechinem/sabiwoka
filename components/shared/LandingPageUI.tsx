"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mic, Sparkles, Zap, ArrowRight, ShieldCheck, Smartphone } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#134e4a] selection:text-white overflow-hidden">
      {/* Background Decorative Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[#134e4a]/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#5208d4]/10 blur-[100px] rounded-full" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#134e4a] flex items-center justify-center shadow-[0_0_20px_rgba(19,78,74,0.5)]">
            <span className="text-xl">✨</span>
          </div>
          <span className="text-xl font-black tracking-tighter">SabiWoka</span>
        </div>
        <Link 
          href="/login" 
          className="text-sm font-bold bg-white/5 border border-white/10 px-6 py-2.5 rounded-full hover:bg-white/10 transition-all"
        >
          Login
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="px-4 py-1.5 rounded-full bg-[#134e4a]/30 border border-[#134e4a]/50 text-[#2eb966] text-[10px] font-black uppercase tracking-[0.2em] mb-6 inline-block">
            Powered by Gemini 1.5 Flash
          </span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
            Turn Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2eb966] to-[#134e4a]">Voice</span> <br />
            Into Business Data.
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            The AI-powered assistant for Nigerian vendors. Record sales, track leads, and manage inventory just by speaking. 
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="group relative w-full md:w-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#2eb966] to-[#134e4a] rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <button className="relative w-full md:w-auto px-10 py-5 bg-[#134e4a] rounded-full text-white font-black text-lg flex items-center justify-center gap-2">
                Start SabiWoka Free <ArrowRight size={20} />
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            {
              icon: <Mic className="text-[#2eb966]" />,
              title: "AI Voice Logs",
              desc: "Speak naturally in English or Pidgin. Our AI extracts prices, names, and items instantly."
            },
            {
              icon: <Sparkles className="text-[#e1ae1b]" />,
              title: "Magic Paste",
              desc: "Paste messy WhatsApp chats. We'll extract the orders and customer details for you."
            },
            {
              icon: <Zap className="text-[#5208d4]" />,
              title: "Instant Invoices",
              desc: "Auto-generate professional invoices and send them via WhatsApp in one tap."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-[#134e4a]/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Social Proof / Trust */}
        <div className="mt-32 pt-20 border-t border-white/5 flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
          <div className="flex items-center gap-2 font-bold text-xl"><Smartphone size={24}/> Mobile First</div>
          <div className="flex items-center gap-2 font-bold text-xl"><ShieldCheck size={24}/> Secure Data</div>
          <div className="flex items-center gap-2 font-bold text-xl"><Zap size={24}/> Fast Sync</div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 text-center text-gray-600 text-xs font-medium uppercase tracking-widest">
        &copy; 2026 SabiWoka AI. Built for the hustle.
      </footer>
    </div>
  );
}