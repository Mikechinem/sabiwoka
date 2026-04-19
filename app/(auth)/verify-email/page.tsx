"use client";

import { motion } from "framer-motion";
import { MailOpen } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
      >
        <div className="w-20 h-20 bg-[#134e4a]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <MailOpen size={40} className="text-[#134e4a]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-500 text-sm mb-8">
          We sent a verification link to your inbox. Tap the link to activate your Sabiwoka account.
        </p>
        <Link href="/login" className="block w-full h-12 flex items-center justify-center bg-[#134e4a] text-white rounded-full font-bold text-sm">
          Go to Login
        </Link>
      </motion.div>
    </div>
  );
}