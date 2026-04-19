"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setMessage(error.message);
      setIsSuccess(false);
    } else {
      setIsSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#f8faf8]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[360px]"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black italic text-[#134e4a] tracking-tighter" style={{ fontFamily: "Georgia, serif" }}>
            sabiwoka
          </h1>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-green-900/5 p-8 relative overflow-hidden">
          {/* Brand Background Glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#134e4a]/5 rounded-full blur-3xl" />

          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl mb-6 bg-[#134e4a]/10 text-[#134e4a]">
                  <Mail size={22} />
                </div>

                <h2 className="text-xl font-black text-gray-900 mb-2">
                  Forgot password?
                </h2>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                  No wahala — enter your business email and we'll send a reset link immediately.
                </p>

                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">
                      Business Email
                    </label>
                    <input
                      type="email"
                      placeholder="name@business.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full h-12 px-5 rounded-2xl border border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#134e4a]/10 focus:bg-white transition-all"
                    />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#134e4a] text-white font-bold rounded-full shadow-lg shadow-green-900/20 disabled:opacity-60 transition-all flex items-center justify-center"
                  >
                    {loading ? "Sending link..." : "Send Reset Link"}
                  </motion.button>
                </form>

                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-2xl text-xs font-bold text-center bg-red-50 text-red-500 border border-red-100"
                  >
                    {message}
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-6 bg-green-50 text-[#2eb966]">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-2">Email Sent!</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Check your inbox for <b>{email}</b>. If you don't see it, check your spam folder.
                </p>
                <button 
                  onClick={() => setIsSuccess(false)}
                  className="text-xs font-bold text-[#134e4a] underline underline-offset-4"
                >
                  Try a different email
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#134e4a] opacity-60 hover:opacity-100 transition-opacity"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}