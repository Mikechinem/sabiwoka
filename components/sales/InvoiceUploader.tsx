"use client";

import { useState, useRef } from "react";
import { Camera, RefreshCw } from "lucide-react";

interface Props {
  onDataExtracted: (data: any) => void;
  scanType?: "sale" | "inventory";
}

export default function InvoiceUploader({ onDataExtracted, scanType = "inventory" }: Props) {
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    const reader = new FileReader();

    reader.onloadend = async () => {
      const originalBase64 = reader.result as string;
      const compressedBase64 = await compressImage(originalBase64);

      try {
        const response = await fetch("/api/ai/invoice-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: compressedBase64,
            scanType: scanType,
          }),
        });

        const text = await response.text();

        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Server returned an unexpected response. Please try again.");
        }

        if (data.error) throw new Error(data.error);

        // MAGIC: Send the data straight up to the global modal!
        onDataExtracted(data);

      } catch (error: any) {
        console.error("Scan error:", error);
        alert(`AI Error: ${error.message || "Could not read image"}`);
      } finally {
        setScanning(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={scanning}
        className="w-full py-5 border-2 border-dashed border-[#134e4a]/20 rounded-2xl flex flex-col items-center justify-center gap-2 text-[#134e4a] bg-teal-50/30 active:scale-[0.98]"
      >
        {scanning ? (
          <RefreshCw className="animate-spin text-teal-600" size={24} />
        ) : (
          <Camera size={24} />
        )}
        <p className="text-[10px] font-black uppercase tracking-widest">
          {scanning
            ? "SabiWoka AI Reading..."
            : `Auto-Fill ${scanType === "sale" ? "Sale" : "Inventory"}`}
        </p>
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}