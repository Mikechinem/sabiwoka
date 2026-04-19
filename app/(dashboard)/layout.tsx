"use client";

import BottomNav from "@/components/shared/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Main Content Area */}
      <main className="animate-in fade-in duration-500">
        {children}
      </main>

      {/* Persistent Mobile Navigation */}
      <BottomNav />
    </div>
  );
}