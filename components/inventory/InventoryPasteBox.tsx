"use client";
import { useState } from "react";
import { parseInventoryInput } from "@/lib/groq/inventory-parser";
import { Loader2, ClipboardType } from "lucide-react";

interface Props {
  onDataExtracted: (items: any[]) => void;
}

export default function InventoryPasteBox({ onDataExtracted }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      // This specifically calls the inventory-tuned Groq parser
      const items = await parseInventoryInput(text);
      onDataExtracted(items);
      setText(""); 
    } catch (error) {
      alert("AI couldn't parse the stock list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        className="w-full h-32 p-4 bg-gray-50 rounded-2xl text-sm border-none outline-none resize-none"
        placeholder="Paste supplier list here... (e.g. 100 Zinc packs at 1500 each)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={handleProcess}
        disabled={loading || !text}
        className="w-full py-4 bg-[#134e4a] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : "Extract Stock Data"}
      </button>
    </div>
  );
}