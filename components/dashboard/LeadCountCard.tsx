import Link from "next/link";
import { Users } from "lucide-react";

interface LeadCountProps {
  count: number;
}

export default function LeadCountCard({ count }: LeadCountProps) {
  return (
    <Link href="/leads" className="bg-white/90 p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3">
      <div className="w-10 h-10 bg-[#e1ae1b]/10 rounded-2xl flex items-center justify-center text-[#e1ae1b]">
        <Users size={20} />
      </div>
      <div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Customer pipeline</p>
        <p className="text-xl font-bold text-gray-900">{count}</p>
      </div>
    </Link>
  );
}