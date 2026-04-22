"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, Sparkles } from "lucide-react";

interface Props {
  onDataExtracted: (data: any) => void; // This sends the data back to your main form
}

export default function InvoiceUploader({ onDataExtracted }: Props) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = (reader.result as string).split(",")[1];
      
      try {
        const response = await fetch("/api/ai/invoice-scan", {
          method: "POST",
          body: JSON.stringify({ image: base64Image }),
        });
        const data = await response.json();
        
        // Pass the AI-extracted data to the form
        onDataExtracted(data); 
      } catch (err) {
        alert("Could not read receipt details.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mb-4">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleUpload} 
        accept="image/*" 
        className="hidden" 
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="w-full py-4 border-2 border-dashed border-teal-200 rounded-2xl bg-teal-50/50 flex items-center justify-center gap-2 text-[#134e4a] transition-all active:scale-95"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <>
            <Sparkles size={18} className="text-teal-600" />
            <span className="text-xs font-black uppercase tracking-widest">Auto-Fill from Receipt</span>
          </>
        )}
      </button>
    </div>
  );
}