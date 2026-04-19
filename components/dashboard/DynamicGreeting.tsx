"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function DynamicGreeting() {
  const [displayText, setDisplayText] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function getIdentity() {
      const { data: { user } } = await supabase.auth.getUser();

      let name = "Boss";
      if (user?.user_metadata?.full_name) {
        name = user.user_metadata.full_name.split(" ")[0];
      } else if (user?.email) {
        name = user.email.split("@")[0];
      }

      setFirstName(name);
      setLoading(false);
    }

    getIdentity();
  }, []);

  const fullMessage = useMemo(() => {
    if (loading || !firstName) return "";

    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    if (hour >= 0 && hour < 5)
      return `Doing night owl things, ${firstName}? 🦉 Take it easy o.`;

    if (hour >= 5 && hour < 12)
      return day === 1
        ? `Monday energy, ${firstName}! 🚀 Let's get it.`
        : `Morning, ${firstName}! ☀️ Ready for the day?`;

    if (hour >= 12 && hour < 17)
      return `How's the market today, ${firstName}? ⚡ Hope light dey!`;

    if (hour >= 17 && hour < 22)
      return day === 5 || day === 6
        ? `Weekend prep mode, ${firstName}! 📦`
        : `Evening, ${firstName}. Great work today.`;

    return `Winding down, ${firstName}? 🌙 You've earned the rest.`;
  }, [firstName, loading]);

  // Reset when message changes
  useEffect(() => {
    setDisplayText("");
    setIndex(0);
  }, [fullMessage]);

  // Typing effect (stable)
  useEffect(() => {
    if (!fullMessage) return;

    if (index < fullMessage.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + fullMessage[index]);
        setIndex((prev) => prev + 1);
      }, 45);

      return () => clearTimeout(timeout);
    }
  }, [index, fullMessage]);

  return (
    <div className="mb-8 min-h-[60px]">
      <h1 className="text-xl font-bold text-gray-800 tracking-tight transition-all">
        {displayText}
        {displayText.length < fullMessage.length && (
          <span className="animate-pulse inline-block w-1 h-5 bg-[#134e4a] ml-1 align-middle" />
        )}
      </h1>

      <p className="text-[13px] text-gray-400 font-medium mt-1 italic">
        {loading
          ? "Syncing your data..."
          : "Here is what is happening with your sales right now."}
      </p>
    </div>
  );
}