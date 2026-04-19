"use client";

import BottomNav from "@/components/shared/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <main className="animate-in fade-in duration-500">
        {children} {/* This is where the HomeDashboard will be injected */}
      </main>
      <BottomNav />
    </div>
  );
}