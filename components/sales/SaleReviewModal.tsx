"use client";

import { useState, useEffect } from "react";
import { X, Save, ShoppingBag, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { queueOfflineAction } from "@/lib/sync-engine";

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
          setItems(prev => prev.map(item => autoLinkItem(item, prods)));
        }
      }
    };
    fetchInventory();
  }, []);

  const autoLinkItem = (item: ScannedSaleItem, invList: any[]) => {
    if (!item.name || !item.name.trim()) return { ...item, product_id: null };
    const typedName = item.name.toLowerCase().trim();
    const typedWords = typedName.split(/\s+/).filter((w: string) => w.length > 0);

    const match = invList.find(p => {
      if (!p.name) return false;
      const dbName = p.name.toLowerCase();
      if (dbName === typedName) return true;
      return typedWords.every((w: string) => dbName.includes(w));
    });

    if (match) {
      return {
        ...item,
        product_id: match.id,
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
      let updatedItem = { ...newItems[index], [key]: key === "name" ? value : Number(value) };
      if (key === "name") updatedItem = autoLinkItem(updatedItem, inventory);
      newItems[index] = updatedItem;
      return newItems;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { name: "", quantity: 1, unit_price: 0, product_id: null }]);
  };

  async function handleConfirm() {
    if (items.length === 0) return;

    const supabase = createClient();

    // --- 1. OFFLINE SYNC HANDLER (Check this first to avoid fetch errors) ---
    if (!navigator.onLine) {
      // Use getSession to get user data from local storage without a network request
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        alert("Authentication error: SabiWoka needs you to log in once with internet to save your credentials.");
        return;
      }

      const offlineSaleId = crypto.randomUUID();

      const offlinePayload = {
        sale: {
          id: offlineSaleId,
          user_id: userId,
          customer_name: customerName || "Walk-in Customer",
          customer_phone: customerPhone || null,
          total_amount: totalAmount,
          amount_paid: paid,
          payment_status: paymentStatus,
          input_method: "manual",
          sold_at: new Date().toISOString(),
        },
        items: items
          .filter(item => item.name && item.name.trim() !== "")
          .map(item => ({
            sale_id: offlineSaleId,
            product_id: item.product_id || null,
            product_name: item.name.trim(),
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.unit_price) || 0,
          }))
      };

      await queueOfflineAction('ADD_SALE', offlinePayload);
      alert("Offline Mode: Sale saved to your phone. It will sync automatically when your network returns.");
      onSuccess();
      return;
    }

    // --- 2. ONLINE HANDLER ---
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User session expired. Please log in.");

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
        .select().single();

      if (saleError) throw saleError;

      const validItems = items
        .filter(item => item.name && item.name.trim() !== "")
        .map(item => ({
          sale_id: saleData.id,
          product_id: item.product_id || null,
          product_name: item.name.trim(),
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
        }));

      if (validItems.length > 0) {
        await supabase.from("sale_items").insert(validItems);
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
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2"><ShoppingBag className="text-[#134e4a]" size={22} /><h2 className="font-black text-lg">Confirm Sale</h2></div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
        </div>

        <div className="space-y-3 mb-5">
          <input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none font-medium" />
          <input placeholder="Phone number (optional)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none font-medium" />
        </div>

        <div className="space-y-3 mb-5">
          {items.map((item, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative">
              <button onClick={() => removeItem(idx)} className="absolute -top-2 -right-2 bg-white text-red-500 p-1.5 rounded-full shadow-sm border border-red-50"><Trash2 size={14} /></button>
              <input placeholder="Item name" className="w-full font-bold bg-white p-3 rounded-xl border border-gray-200 mb-3 text-sm outline-none" value={item.name || ""} onChange={(e) => updateItem(idx, "name", e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[9px] uppercase font-black text-gray-400">Qty</label><input type="number" className="w-full bg-white p-2 rounded-xl text-xs font-bold border-none outline-none" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} /></div>
                <div><label className="text-[9px] uppercase font-black text-gray-400">Unit Price</label><input type="number" className="w-full bg-white p-2 rounded-xl text-xs font-bold border-none outline-none" value={item.unit_price} onChange={(e) => updateItem(idx, "unit_price", e.target.value)} /></div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addItem} className="w-full py-3 mb-5 border-2 border-dashed border-[#134e4a]/30 text-[#134e4a] font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-[#134e4a]/5 transition-colors">+ Add Item</button>
        </div>

        <div className="p-4 bg-gray-50 rounded-2xl mb-5 space-y-3">
          <div className="flex justify-between"><span className="text-xs text-gray-500 font-semibold">Total</span><span className="text-sm font-black text-gray-900">₦{totalAmount.toLocaleString()}</span></div>
          <div><label className="text-[9px] uppercase font-black text-gray-400 mb-1 block">Amount Paid</label><input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="w-full bg-white p-3 rounded-xl text-sm font-bold border-none outline-none" /></div>
        </div>

        <button onClick={handleConfirm} disabled={saving || items.length === 0} className="w-full py-4 bg-[#134e4a] text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
          {saving ? "Saving..." : <><Save size={18} /> Confirm Sale</>}
        </button>
      </motion.div>
    </div>
  );
}