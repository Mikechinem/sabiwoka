"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/verify-email");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-6">
          <h1
            className="text-3xl font-bold italic"
            style={{ color: "#134e4a", fontFamily: "Georgia, serif" }}
          >
            sabiwoka
          </h1>
          <p className="text-sm text-gray-500 mt-1">Your smart sales assistant</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-7 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create Account</h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Ada Okonkwo"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all"
                  onFocus={(e) => e.target.style.boxShadow = "0 0 0 2px #134e4a40"}
                  onBlur={(e) => e.target.style.boxShadow = "none"}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Business Email
              </label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all"
                onFocus={(e) => e.target.style.boxShadow = "0 0 0 2px #134e4a40"}
                onBlur={(e) => e.target.style.boxShadow = "none"}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="min 6 characters"
                  className="w-full h-12 px-4 pr-12 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all"
                  onFocus={(e) => e.target.style.boxShadow = "0 0 0 2px #134e4a40"}
                  onBlur={(e) => e.target.style.boxShadow = "none"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full text-white font-semibold text-sm transition-opacity disabled:opacity-70 mt-2"
              style={{ background: "#134e4a" }}
            >
              {loading ? "Creating account..." : "Create account"}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold underline underline-offset-2"
            style={{ color: "#134e4a" }}
          >
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}