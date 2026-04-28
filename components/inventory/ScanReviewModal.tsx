"use client";
import { useState } from "react";
import { X, Save, PackageCheck, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface ScannedItem {
  name: string;
  quantity: number;
  buying_price: number;
  selling_price?: number;
}

interface ScanReviewModalProps {
  items: ScannedItem[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScanReviewModal({ items, onClose, onSuccess }: ScanReviewModalProps) {
  const [editedItems, setEditedItems] = useState<ScannedItem[]>(items);
  const [saving, setSaving] = useState(false);

  const updateItem = (index: number, key: keyof ScannedItem, value: string | number) => {
    const newItems = [...editedItems];
    newItems[index] = { ...newItems[index], [key]: value };
    setEditedItems(newItems);
  };

  const removeItem = (index: number) => {
    setEditedItems(editedItems.filter((_, i) => i !== index));
  };

  async function handleConfirmSave() {
    if (editedItems.length === 0) return onClose();
    
    setSaving(true);
    const supabase = createClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const item of editedItems) {
        const cleanName = item.name.trim();

        const { data: existing } = await supabase
          .from("products")
          .select("id, stock_quantity")
          .ilike("name", cleanName)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) {
          await supabase.from("products").update({
            stock_quantity: (existing.stock_quantity || 0) + Number(item.quantity),
            buying_price: Number(item.buying_price),
            price: Number(item.selling_price || item.buying_price * 1.5),
            updated_at: new Date().toISOString()
          }).eq("id", existing.id);
        } else {
          await supabase.from("products").insert({
            user_id: user.id,
            name: cleanName,
            stock_quantity: Number(item.quantity),
            buying_price: Number(item.buying_price),
            price: Number(item.selling_price || item.buying_price * 1.5),
            low_stock_threshold: 5
          });
        }
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Save failed. Check console.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <PackageCheck className="text-[#134e4a]" size={22} />
            <h2 className="font-black text-lg">Confirm Stock</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500">
            <X size={20}/>
          </button>
        </div>

        <div className="space-y-4">
          {editedItems.map((item, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative">
              <button 
                onClick={() => removeItem(idx)}
                className="absolute -top-2 -right-2 bg-white text-red-500 p-1.5 rounded-full shadow-sm border border-red-50"
              >
                <Trash2 size={14} />
              </button>

            <input
                placeholder="Type item name here..."
                // 👇 Notice how we changed the classes here to bg-white, border, and p-3
                className="w-full font-bold bg-white p-3 rounded-xl border border-gray-200 mb-3 text-gray-900 outline-none text-sm focus:border-[#134e4a] focus:ring-2 focus:ring-[#134e4a]/20 transition-all placeholder:text-gray-400 placeholder:font-medium"
                value={item.name || ""}
                onChange={(e) => updateItem(idx, "name", e.target.value)}
              />
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[9px] uppercase font-black text-gray-400">Qty</label>
                  <input 
                    type="number" 
                    className="w-full bg-white p-2 rounded-xl text-xs font-bold border-none outline-none" 
                    value={item.quantity} 
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-black text-gray-400">Cost (₦)</label>
                  <input 
                    type="number" 
                    className="w-full bg-white p-2 rounded-xl text-xs font-bold border-none outline-none" 
                    value={item.buying_price} 
                    onChange={(e) => updateItem(idx, 'buying_price', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-black text-gray-400">Sell (₦)</label>
                  <input 
                    type="number" 
                    className="w-full bg-white p-2 rounded-xl text-xs font-bold border-none outline-none" 
                    value={item.selling_price || 0} 
                    onChange={(e) => updateItem(idx, 'selling_price', e.target.value)} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={handleConfirmSave} 
          disabled={saving || editedItems.length === 0} 
          className="w-full mt-8 py-4 bg-[#134e4a] text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
        >
          {saving ? "Saving..." : <><Save size={18}/> Add to Warehouse</>}
        </button>
      </motion.div>
    </div>
  );
}