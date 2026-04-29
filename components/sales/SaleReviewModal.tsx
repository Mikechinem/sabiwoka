"use client";

import { useState, useEffect } from "react";
import { X, Save, ShoppingBag, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface ScannedSaleItem {
  name: string;
  quantity: number;
  unit_price: number;
  product_id?: string | null;
}

interface SaleReviewModalProps {
  data: {
    customer_name?: string | null;
    customer_phone?: string | null;
    total_amount?: number | null;
    amount_paid?: number | null;
    items: ScannedSaleItem[];
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function SaleReviewModal({ data, onClose, onSuccess }: SaleReviewModalProps) {
  const [items, setItems] = useState<ScannedSaleItem[]>(
    (data.items || []).map(item => ({
      ...item,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
    }))
  );
  
  const [customerName, setCustomerName] = useState(data.customer_name || "");
  const [customerPhone, setCustomerPhone] = useState(data.customer_phone || "");
  const [amountPaid, setAmountPaid] = useState(String(data.amount_paid ?? data.total_amount ?? ""));
  
  const [saving, setSaving] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);

  // 1. Fetch inventory on load
  useEffect(() => {
    const fetchInventory = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prods } = await supabase
          .from("products")
          .select("id, name, price")
          .eq("user_id", user.id);
          
        if (prods) {
          setInventory(prods);
          // Auto-link existing data right when the modal opens
          setItems(prev => prev.map(item => autoLinkItem(item, prods)));
        }
      }
    };
    fetchInventory();
  }, []);

  // 2. THE NEW SMART MATCHER: Handles multiple words flawlessly!
  const autoLinkItem = (item: ScannedSaleItem, invList: any[]) => {
    if (!item.name || !item.name.trim()) return { ...item, product_id: null };
    
    const typedName = item.name.toLowerCase().trim();
    // Fixed the implicit 'any' error by adding (w: string)
    const typedWords = typedName.split(/\s+/).filter((w: string) => w.length > 0);

    const match = invList.find(p => {
      if (!p.name) return false;
      const dbName = p.name.toLowerCase();
      // Fixed the implicit 'any' error
      const dbWords = dbName.split(/\s+/).filter((w: string) => w.length > 0);

      if (dbName === typedName) return true;

      // Fixed the implicit 'any' error
      const allTypedInDb = typedWords.every((w: string) => dbName.includes(w));
      const allDbInTyped = dbWords.every((w: string) => typedName.includes(w));

      return allTypedInDb || allDbInTyped;
    });

    if (match) {
      return {
        ...item,
        product_id: match.id,
        // Auto-fill price if they haven't typed one yet
        unit_price: Number(item.unit_price) > 0 ? Number(item.unit_price) : (Number(match.price) || 0)
      };
    }
    
    return { ...item, product_id: null };
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0
  );
  
  const paid = parseFloat(amountPaid || "0");
  const paymentStatus = paid === 0 ? "unpaid" : paid >= totalAmount ? "paid" : "partial";

  const updateItem = (index: number, key: keyof ScannedSaleItem, value: string) => {
    setItems((prev) => {
      const newItems = [...prev];
      let updatedItem = {
        ...newItems[index],
        [key]: key === "name" ? value : Number(value)
      };

      // Live-check the database every time a letter is typed
      if (key === "name") {
        updatedItem = autoLinkItem(updatedItem, inventory);
      }

      newItems[index] = updatedItem;
      return newItems;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev, 
      { name: "", quantity: 1, unit_price: 0, product_id: null }
    ]);
  };

  async function handleConfirm() {
    if (items.length === 0) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    try {
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert({
          user_id: user.id,
          customer_name: customerName || "Walk-in Customer",
          customer_phone: customerPhone || null,
          total_amount: totalAmount,
          amount_paid: paid,
          payment_status: paymentStatus,
          input_method: "manual",
          sold_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Strict data cleaning to ensure database doesn't reject it
      const validItems = items
        .filter(item => item.name && item.name.trim() !== "")
        .map(item => ({
          sale_id: saleData.id,
          // Guard against empty strings crashing the PostgreSQL UUID column
          product_id: (item.product_id && item.product_id.trim() !== "") ? item.product_id : null,
          product_name: item.name.trim(),
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
        }));

      if (validItems.length > 0) {
        const { error: itemsError } = await supabase.from("sale_items").insert(validItems);
        if (itemsError) throw itemsError;
      }

      if (paymentStatus !== "paid") {
        await supabase.from("debts").insert({
          user_id: user.id,
          sale_id: saleData.id,
          customer_name: customerName || "Walk-in Customer",
          customer_phone: customerPhone || null,
          total_amount: totalAmount,
          amount_paid: paid,
          is_settled: false,
        });
      }

      onSuccess();
    } catch (err: any) {
      console.error("Sale save error:", err);
      // Detailed error message so you know exactly what failed
      alert(`Save failed: ${err.message || "Database rejected the entry"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-[#134e4a]" size={22} />
            <h2 className="font-black text-lg">Confirm Sale</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Customer details */}
        <div className="space-y-3 mb-5">
          <input
            placeholder="Customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none font-medium focus:ring-2 focus:ring-[#134e4a]/20 transition-all"
          />
          <input
            placeholder="Phone number (optional)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none font-medium focus:ring-2 focus:ring-[#134e4a]/20 transition-all"
          />
        </div>

        {/* Items */}
        <div className="space-y-3 mb-5">
          {items.map((item, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative">
              <button
                onClick={() => removeItem(idx)}
                className="absolute -top-2 -right-2 bg-white text-red-500 p-1.5 rounded-full shadow-sm border border-red-50 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
              
              <input
                placeholder="Type item name here..."
                className="w-full font-bold bg-white p-3 rounded-xl border border-gray-200 mb-3 text-gray-900 outline-none text-sm focus:border-[#134e4a] focus:ring-2 focus:ring-[#134e4a]/20 transition-all placeholder:text-gray-400 placeholder:font-medium"
                value={item.name || ""}
                onChange={(e) => updateItem(idx, "name", e.target.value)}
              />

              {item.product_id && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-green-600 font-bold uppercase mb-2 flex items-center gap-1">
                  ✓ Linked to inventory — stock will deduct
                </motion.p>
              )}
              {!item.product_id && (
                <p className="text-[9px] text-amber-500 font-bold uppercase mb-2">
                  Not in inventory — stock won't deduct
                </p>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] uppercase font-black text-gray-400">Qty</label>
                  <input
                    type="number"
                    className="w-full bg-white p-2 rounded-xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-[#134e4a]/20 transition-all"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-black text-gray-400">Unit Price (₦)</label>
                  <input
                    type="number"
                    className="w-full bg-white p-2 rounded-xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-[#134e4a]/20 transition-all"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add Another Item Button */}
          <button
            type="button"
            onClick={addItem}
            className="w-full py-3 mb-5 border-2 border-dashed border-[#134e4a]/30 text-[#134e4a] font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-[#134e4a]/5 transition-colors"
          >
            + Add Another Item
          </button>
        </div>

        {/* Payment */}
        <div className="p-4 bg-gray-50 rounded-2xl mb-5 space-y-3">
          <div className="flex justify-between">
            <span className="text-xs text-gray-500 font-semibold">Total</span>
            <span className="text-sm font-black text-gray-900">
              ₦{totalAmount.toLocaleString()}
            </span>
          </div>
          <div>
            <label className="text-[9px] uppercase font-black text-gray-400 mb-1 block">
              Amount Paid (₦)
            </label>
            <input
              type="number"
              placeholder="Enter 0 if not paid yet"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full bg-white p-3 rounded-xl text-sm font-bold border-none outline-none focus:ring-2 focus:ring-[#134e4a]/20 transition-all"
            />
          </div>
          <div
            className="text-xs font-bold text-center py-2 rounded-xl transition-colors duration-300"
            style={{
              color: paymentStatus === "paid" ? "#2eb966" : paymentStatus === "partial" ? "#e1ae1b" : "#ef4444",
              background: paymentStatus === "paid" ? "#f0fdf4" : paymentStatus === "partial" ? "#fefce8" : "#fef2f2",
            }}
          >
            {paymentStatus === "paid"
              ? "Fully Paid"
              : paymentStatus === "partial"
              ? `Balance: ₦${(totalAmount - paid).toLocaleString()}`
              : "Unpaid — will create a debt record"}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={saving || items.length === 0}
          className="w-full py-4 bg-[#134e4a] text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-opacity"
        >
          {saving ? "Saving..." : <><Save size={18} /> Confirm Sale</>}
        </button>
      </motion.div>
    </div>
  );
}