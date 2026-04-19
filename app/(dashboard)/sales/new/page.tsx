"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

type SaleItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
};

export default function NewSalePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    amount_paid: "",
    notes: "",
  });
  const [items, setItems] = useState<SaleItem[]>([
    { product_name: "", quantity: 1, unit_price: 0 },
  ]);

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateItem(index: number, key: keyof SaleItem, value: string) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, [key]: key === "product_name" ? value : Number(value) }
          : item
      )
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { product_name: "", quantity: 1, unit_price: 0 }]);
  }

  function removeItem(index: number) {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price, 0
  );
  const amountPaid = parseFloat(form.amount_paid || "0");
  const balance = totalAmount - amountPaid;
  const paymentStatus =
    amountPaid === 0 ? "unpaid" : amountPaid >= totalAmount ? "paid" : "partial";

  async function handleSubmit() {
    if (!form.customer_name || totalAmount === 0) {
      setError("Customer name and at least one item with a price are required.");
      return;
    }
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data: saleData, error: saleError } = await supabase
      .from("sales")
      .insert({
        user_id: user.id,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone || null,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        payment_status: paymentStatus,
        input_method: "manual",
        notes: form.notes || null,
        sold_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saleError) {
      setError(saleError.message);
      setSaving(false);
      return;
    }

    const saleItems = items
      .filter((item) => item.product_name && item.unit_price > 0)
      .map((item) => ({
        sale_id: saleData.id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

    if (saleItems.length > 0) {
      await supabase.from("sale_items").insert(saleItems);
    }

    if (paymentStatus !== "paid") {
      await supabase.from("debts").insert({
        user_id: user.id,
        sale_id: saleData.id,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone || null,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        is_settled: false,
      });
    }

    router.push("/sales");
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 mb-6"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Sale</h1>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"
        >
          {error}
        </motion.div>
      )}

      {/* Customer Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <h2 className="text-sm font-bold text-gray-700 mb-3">Customer Details</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              placeholder="Ada Okonkwo"
              value={form.customer_name}
              onChange={(e) => updateForm("customer_name", e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none transition-all"
              onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px #134e4a30")}
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="08012345678"
              value={form.customer_phone}
              onChange={(e) => updateForm("customer_phone", e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none transition-all"
              onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px #134e4a30")}
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
          </div>
        </div>
      </div>

      {/* Sale Items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <h2 className="text-sm font-bold text-gray-700 mb-3">Items Sold</h2>
        <div className="space-y-3">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-gray-50 rounded-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500">
                  Item {index + 1}
                </span>
                {items.length > 1 && (
                  <button onClick={() => removeItem(index)}>
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Product name"
                  value={item.product_name}
                  onChange={(e) => updateItem(index, "product_name", e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Qty"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Unit price (₦)"
                    value={item.unit_price || ""}
                    onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none"
                  />
                </div>
                {item.unit_price > 0 && (
                  <p className="text-xs text-right font-semibold" style={{ color: "#134e4a" }}>
                    Subtotal: ₦{(item.quantity * item.unit_price).toLocaleString()}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <button
          onClick={addItem}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: "#134e4a" }}
        >
          <Plus size={13} /> Add another item
        </button>
      </div>

      {/* Payment Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <h2 className="text-sm font-bold text-gray-700 mb-3">Payment</h2>

        {totalAmount > 0 && (
          <div className="flex items-center justify-between mb-3 px-3 py-2 bg-gray-50 rounded-xl">
            <span className="text-xs text-gray-500">Total Amount</span>
            <span className="text-sm font-bold text-gray-900">
              ₦{totalAmount.toLocaleString()}
            </span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Amount Paid (₦)
          </label>
          <input
            type="number"
            placeholder="Enter 0 if not paid yet"
            value={form.amount_paid}
            onChange={(e) => updateForm("amount_paid", e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none transition-all"
            onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px #134e4a30")}
            onBlur={(e) => (e.target.style.boxShadow = "none")}
          />
        </div>

        {totalAmount > 0 && (
          <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-xl"
            style={{
              background: paymentStatus === "paid" ? "#f0fdf4" : paymentStatus === "partial" ? "#fefce8" : "#fef2f2",
            }}
          >
            <span className="text-xs font-semibold"
              style={{
                color: paymentStatus === "paid" ? "#2eb966" : paymentStatus === "partial" ? "#e1ae1b" : "#ef4444",
              }}
            >
              {paymentStatus === "paid" ? "Fully Paid" : paymentStatus === "partial" ? `Balance: ₦${balance.toLocaleString()}` : "Not Paid — will create a debt"}
            </span>
          </div>
        )}

        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Notes
          </label>
          <input
            type="text"
            placeholder="Any extra details..."
            value={form.notes}
            onChange={(e) => updateForm("notes", e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none transition-all"
            onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px #134e4a30")}
            onBlur={(e) => (e.target.style.boxShadow = "none")}
          />
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSubmit}
        disabled={!form.customer_name || totalAmount === 0 || saving}
        className="w-full h-13 rounded-full text-white font-bold text-sm disabled:opacity-50 transition-opacity"
        style={{ background: "#134e4a", height: "52px" }}
      >
        {saving ? "Recording sale..." : "Record Sale"}
      </motion.button>
    </div>
  );
}