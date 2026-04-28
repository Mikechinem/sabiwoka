"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Phone, ShoppingBag, ArrowLeft, MessageCircle, CheckCircle2, XCircle } from "lucide-react";
import type { Lead } from "@/hooks/useLeads";

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchLead() {
      const supabase = createClient();
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("id", id)
        .single();
      if (data) setLead(data as Lead);
      setLoading(false);
    }
    fetchLead();
  }, [id]);

  async function markAsPaid() {
    if (!lead) return;
    setUpdating(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUpdating(false); return; }

    // 1 — Check if a sale was already created for this lead to prevent duplicates
    const { data: existingSale } = await supabase
      .from("sales")
      .select("id")
      .eq("lead_id", lead.id)
      .single();

    // 2 — Update lead status to paid
    await supabase
      .from("leads")
      .update({ status: "paid" })
      .eq("id", lead.id);

    // 3 — Only create sale if one doesn't already exist for this lead
    if (!existingSale && lead.amount) {
      const soldAt = new Date();
      soldAt.setSeconds(0, 0);

      const { data: saleData } = await supabase
        .from("sales")
        .insert({
          user_id: user.id,
          lead_id: lead.id,
          customer_name: lead.full_name,
          customer_phone: lead.phone ?? null,
          total_amount: lead.amount,
          amount_paid: lead.amount,
          payment_status: "paid",
          input_method: "magic_paste",
          notes: `Converted from lead — ${lead.item_of_interest ?? ""}`,
          sold_at: soldAt.toISOString(),
        })
        .select()
        .single();

      // 4 — Add sale item and link to inventory product if it exists
      if (saleData && lead.item_of_interest) {
        const { data: matchedProduct } = await supabase
          .from("products")
          .select("id")
          .eq("user_id", user.id)
          .ilike("name", lead.item_of_interest.trim())
          .single();

        await supabase.from("sale_items").insert({
          sale_id: saleData.id,
          product_id: matchedProduct?.id ?? null,
          product_name: lead.item_of_interest,
          quantity: 1,
          unit_price: lead.amount,
        });
      }
    }

    setLead({ ...lead, status: "paid" });
    setUpdating(false);
  }

  async function markAsLost() {
    if (!lead) return;
    setUpdating(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("leads")
      .update({ status: "lost" })
      .eq("id", lead.id);

    if (!error) {
      setLead({ ...lead, status: "lost" });
    }
    setUpdating(false);
  }

  if (loading) return (
    <div className="max-w-md mx-auto px-4 pt-8">
      <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  );

  if (!lead) return (
    <div className="max-w-md mx-auto px-4 pt-8 text-center">
      <p className="text-gray-400">Lead not found</p>
    </div>
  );

  const isClosed = lead.status === "paid" || lead.status === "lost";

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 mb-6"
      >
        <ArrowLeft size={16} /> Back to leads
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 ${isClosed ? "opacity-80" : ""}`}
      >
        <div className="flex justify-between items-start mb-1">
          <h1 className="text-xl font-bold text-gray-900">{lead.full_name}</h1>
          {isClosed && (
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
              lead.status === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {lead.status}
            </span>
          )}
        </div>

        {lead.phone && (
          <p className="text-sm text-gray-400 flex items-center gap-1.5 mb-4">
            <Phone size={13} /> {lead.phone}
          </p>
        )}

        {lead.item_of_interest && (
          <div className="flex items-center gap-2 text-sm text-gray-700 mb-4">
            <ShoppingBag size={14} />
            <span>{lead.item_of_interest}</span>
            {lead.amount && (
              <span className="ml-auto font-bold text-gray-900">
                ₦{Number(lead.amount).toLocaleString()}
              </span>
            )}
          </div>
        )}

        {lead.notes && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 leading-relaxed">
            {lead.notes}
          </p>
        )}
      </motion.div>

      <div className="flex flex-col gap-3">
        {!isClosed ? (
          <>
            {lead.whatsapp_url && (
              <a href={lead.whatsapp_url} target="_blank" rel="noopener noreferrer">
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  className="w-full h-12 bg-[#25D366] text-white rounded-full font-bold flex items-center justify-center gap-2 text-sm"
                >
                  <MessageCircle size={18} /> Send WhatsApp Message
                </motion.div>
              </a>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={markAsPaid}
              disabled={updating}
              className="w-full h-12 rounded-full font-bold flex items-center justify-center gap-2 text-sm text-white disabled:opacity-60"
              style={{ background: "#134e4a" }}
            >
              <CheckCircle2 size={18} />
              {updating ? "Updating..." : "Mark as Paid — Move to Sales"}
            </motion.button>

            <button
              onClick={markAsLost}
              disabled={updating}
              className="w-full h-12 rounded-full font-bold text-sm text-gray-500 bg-transparent border-2 border-gray-200 active:bg-gray-100 transition-all"
            >
              {updating ? "Updating..." : "Mark as Lost"}
            </button>
          </>
        ) : (
          <div className={`w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold border ${
            lead.status === "paid"
              ? "text-[#2eb966] bg-green-50 border-green-100"
              : "text-gray-500 bg-gray-100 border-gray-200"
          }`}>
            {lead.status === "paid" ? (
              <><CheckCircle2 size={18} /> This deal was Won ✅</>
            ) : (
              <><XCircle size={18} /> This deal was Lost ❌</>
            )}
          </div>
        )}
      </div>
    </div>
  );
}