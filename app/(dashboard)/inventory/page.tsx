"use client";
import { useState, useEffect } from "react";
import { Plus, Search, Package, X, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { InventoryItem } from "@/types/inventory";
import { motion, AnimatePresence } from "framer-motion";
import StockScanner from "@/components/inventory/StockScanner";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const supabase = createClient();

  const fetchInventory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (data) setItems(data as InventoryItem[]);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will permanently remove this item.")) return;
    
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("Error deleting item");
    } else {
      setItems(items.filter(item => item.id !== id));
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = items.filter(i => (i.stock_quantity || 0) <= (i.low_stock_threshold || 5)).length;

  return (
    <div className="max-w-md mx-auto px-4 pt-20 pb-28 font-sans">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-5 py-3 rounded-2xl text-white text-sm font-black shadow-lg bg-[#134e4a]"
        >
          <Plus size={18} /> Add Stock
        </button>
        <div className="text-right">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Low Stock</p>
          <p className={`text-sm font-bold ${lowStockCount > 0 ? "text-orange-500" : "text-[#134e4a]"}`}>
            {lowStockCount} {lowStockCount === 1 ? 'Item' : 'Items'}
          </p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text"
          placeholder="Search products..."
          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${(item.stock_quantity || 0) <= (item.low_stock_threshold || 5) ? 'bg-orange-50 text-orange-500' : 'bg-teal-50 text-[#134e4a]'}`}>
                <Package size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">{item.name}</h3>
                <div className="flex gap-2 items-center">
                  <p className="text-[11px] text-gray-500">Sell: ₦{(item.price || 0).toLocaleString()}</p>
                  <p className="text-[11px] text-gray-300">|</p>
                  <p className="text-[11px] text-gray-400 italic">Cost: ₦{(item.buying_price || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={`text-sm font-black ${(item.stock_quantity || 0) <= (item.low_stock_threshold || 5) ? 'text-orange-500' : 'text-gray-800'}`}>
                  {item.stock_quantity || 0} <span className="text-[10px] font-normal text-gray-400">pcs</span>
                </p>
              </div>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-200 hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center p-4">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-black text-lg">Stock Management</h2>
                <button onClick={() => setShowAddModal(false)}><X size={20}/></button>
              </div>
              <StockScanner onComplete={() => { setShowAddModal(false); fetchInventory(); }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}