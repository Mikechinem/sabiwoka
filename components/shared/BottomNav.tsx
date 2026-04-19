"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ShoppingBag, ShieldCheck, Wallet, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Sales", href: "/sales", icon: ShoppingBag },
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Scanner", href: "/scanner", icon: ShieldCheck },
  { name: "Debts", href: "/debts", icon: Wallet },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 px-2 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href} className="relative group">
              <div className="flex flex-col items-center gap-1 px-3">
                <motion.div
                  whileTap={{ scale: 0.8 }}
                  className={`${
                    isActive ? "text-[#134e4a]" : "text-gray-400"
                  } transition-colors`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                <span className={`text-[10px] font-bold ${
                  isActive ? "text-[#134e4a]" : "text-gray-400"
                }`}>
                  {item.name}
                </span>
                
                {/* Active Indicator Dot */}
                {isActive && (
                  <motion.div
                    layoutId="nav-dot"
                    className="absolute -top-1 w-1 h-1 bg-[#134e4a] rounded-full"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}