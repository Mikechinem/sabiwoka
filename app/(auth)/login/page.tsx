"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();
  const supabase = createClient();

  async function signInWithGoogle() {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords do not match!");
        setLoading(false);
        return;
      }
      
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      });
      
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        alert("Success! Please check your email to confirm your account.");
        setLoading(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        router.push("/dashboard");
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#f8faf8] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#134e4a]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black italic text-[#134e4a] tracking-tighter" style={{ fontFamily: "Georgia, serif" }}>
            sabiwoka
          </h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">Your digital sales friend</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-green-900/5 border border-gray-100 px-8 py-10 relative">
          <div className="flex justify-center mb-8 bg-gray-100 p-1.5 rounded-2xl relative z-20">
            <button 
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${mode === 'login' ? 'bg-white text-[#134e4a] shadow-sm' : 'text-gray-400'}`}
            >
              Login
            </button>
            <button 
              onClick={() => { setMode("signup"); setError(""); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${mode === 'signup' ? 'bg-white text-[#134e4a] shadow-sm' : 'text-gray-400'}`}
            >
              Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-[13px] font-bold text-red-600 text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={signInWithGoogle}
            whileTap={{ scale: 0.97 }}
            type="button"
            className="w-full flex items-center justify-center gap-3 h-12 rounded-full border border-gray-200 text-gray-700 font-bold text-sm mb-6 hover:bg-gray-50 transition-all relative z-20"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {mode === "login" ? "Sign in with Google" : "Join with Google"}
          </motion.button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] text-gray-300 font-black tracking-widest">OR</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">
                Business Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@business.com"
                className="w-full h-12 px-5 rounded-2xl border border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#134e4a]/10 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 px-5 pr-12 rounded-2xl border border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#134e4a]/10 focus:bg-white transition-all"
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

            <AnimatePresence>
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1 mt-4">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 px-5 rounded-2xl border border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#134e4a]/10 focus:bg-white transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {mode === "login" && (
              <div className="flex justify-end px-1 relative z-30">
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-[#134e4a] opacity-60 hover:opacity-100 transition-opacity cursor-pointer inline-block py-1"
                >
                  Forgot Password?
                </Link>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-full text-white font-black text-sm shadow-lg shadow-green-900/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 relative z-20"
              style={{ background: "#134e4a" }}
            >
              {loading ? "Please wait..." : (
                <>
                  {mode === "login" ? "Login to Shop" : "Create Account"}
                  <Sparkles size={16} />
                </>
              )}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          By continuing, you agree to our <br/>
          <span className="font-bold text-gray-900">Terms of Service</span> and <span className="font-bold text-gray-900">Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  );
}