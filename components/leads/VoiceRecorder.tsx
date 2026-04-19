"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function DynamicGreeting() {
  const [firstName, setFirstName] = useState("Boss"); // Fallback name
  const [greeting, setGreeting] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function getIdentityAndGreet() {
      // 1. Get the User's First Name
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        const name = user.user_metadata.full_name.split(" ")[0];
        setFirstName(name);
      } else if (user?.email) {
        setFirstName(user.email.split("@")[0]); // Fallback to email prefix
      }

      // 2. Determine Time & Day Logic
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay(); // 0 = Sunday, 1 = Monday, 6 = Saturday

      let message = "";

      // Time-based Logic
      if (hour >= 0 && hour < 5) {
        message = `Doing night owl things, ${firstName}? 🦉 Take it easy o.`;
      } else if (hour >= 5 && hour < 12) {
        message = day === 1 ? `Monday energy, ${firstName}! 🚀 Let's get it.` : `Morning, ${firstName}! ☀️ Ready for the day?`;
      } else if (hour >= 12 && hour < 17) {
        message = `How's the market today, ${firstName}? ⚡ Hope light dey!`;
      } else if (hour >= 17 && hour < 22) {
        message = (day === 5 || day === 6) ? `Weekend prep mode, ${firstName}! 📦` : `Evening, ${firstName}. Great work today.`;
      } else {
        message = `Winding down, ${firstName}? 🌙 You've earned the rest.`;
      }

      setGreeting(message);
    }

    getIdentityAndGreet();
  }, [firstName, supabase]);

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-black text-[#1b1d2e] leading-tight">
        {greeting}
      </h1>
      <p className="text-sm text-gray-500 font-medium mt-1">
        Here is what is happening with Sabiwoka today.
      </p>
    </div>
  );
}