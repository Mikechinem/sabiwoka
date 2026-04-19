"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      alert("Password updated! Logging you in...");
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-[#f8faf8] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Brand Aesthetic Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#134e4a]/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[360px] z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black italic text-[#134e4a] tracking-tighter" style={{ fontFamily: "Georgia, serif" }}>
            sabiwoka
          </h1>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-green-900/5 border border-gray-100 p-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl mb-6 bg-[#134e4a]/10 text-[#134e4a]">
            <ShieldCheck size={24} />
          </div>

          <h2 className="text-xl font-black text-gray-900 mb-2">New Password</h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Enter your new password below to get back into your shop.
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-xs font-bold text-red-500 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 px-5 rounded-2xl border border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#134e4a]/10 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#134e4a] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 px-5 rounded-2xl border border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#134e4a]/10 focus:bg-white transition-all"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#134e4a] text-white font-black text-sm rounded-full shadow-lg shadow-green-900/20 disabled:opacity-50 transition-all flex items-center justify-center"
            >
              {loading ? "Updating..." : "Update Password"}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}