"use client";
import { useState, useRef } from "react";
import { Mic, Clipboard, Camera, PackagePlus, Upload, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import InventoryVoiceRecorder from "@/components/inventory/InventoryVoiceRecorder";
import InventoryPasteBox from "@/components/inventory/InventoryPasteBox";
import ScanReviewModal from "@/components/inventory/ScanReviewModal";

interface StockScannerProps {
  onComplete: () => void;
}

export default function StockScanner({ onComplete }: StockScannerProps) {
  const [activeTab, setActiveTab] = useState<"scan" | "voice" | "paste" | "manual">("scan");
  const [showReview, setShowReview] = useState(false);
  const [scannedResults, setScannedResults] = useState<any[]>([]);
  
  const [cameraScanning, setCameraScanning] = useState(false);
  const [galleryScanning, setGalleryScanning] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: "scan", label: "Scan", icon: Camera },
    { id: "voice", label: "Voice", icon: Mic },
    { id: "paste", label: "Paste", icon: Clipboard },
    { id: "manual", label: "Manual", icon: PackagePlus },
  ];

  const triggerReview = (items: any) => {
    const data = items?.items || (Array.isArray(items) ? items : [items]);
    setScannedResults(data);
    setShowReview(true);
  };

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

  const processImage = async (file: File, source: "camera" | "gallery") => {
    if (source === "camera") setCameraScanning(true);
    if (source === "gallery") setGalleryScanning(true);

    const reader = new FileReader();

    reader.onloadend = async () => {
      const originalBase64 = reader.result as string;
      const compressedBase64 = await compressImage(originalBase64);

      try {
        const response = await fetch("/api/ai/invoice-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: compressedBase64, scanType: "inventory" }),
        });

        const text = await response.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Server returned an unexpected response.");
        }

        if (data.error) throw new Error(data.error);
        triggerReview(data);

      } catch (error: any) {
        alert(`AI Error: ${error.message || "Could not read image"}`);
      } finally {
        setCameraScanning(false);
        setGalleryScanning(false);
        if (cameraInputRef.current) cameraInputRef.current.value = "";
        if (galleryInputRef.current) galleryInputRef.current.value = "";
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showReview && scannedResults.length > 0 && (
          <ScanReviewModal
            items={scannedResults}
            onClose={() => setShowReview(false)}
            onSuccess={() => {
              setShowReview(false);
              onComplete();
            }}
          />
        )}
      </AnimatePresence>

      <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
              activeTab === tab.id
                ? "bg-white shadow-sm text-[#134e4a]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <tab.icon size={18} />
            <span className="text-[10px] font-bold uppercase">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[250px]">
        <AnimatePresence mode="wait">
          {activeTab === "scan" && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-[11px] text-gray-400 font-medium italic mb-4 text-center">
                Point your camera at a physical stock list or invoice.
              </p>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={cameraScanning || galleryScanning}
                className="w-full py-5 border-2 border-dashed border-[#134e4a]/20 rounded-2xl flex flex-col items-center justify-center gap-2 text-[#134e4a] bg-teal-50/30 active:scale-[0.98] transition-transform"
              >
                {cameraScanning ? (
                  <RefreshCw className="animate-spin text-teal-600" size={24} />
                ) : (
                  <Camera size={24} />
                )}
                <p className="text-[10px] font-black uppercase tracking-widest">
                  {cameraScanning ? "SabiWoka AI Reading..." : "Open Camera"}
                </p>
              </button>

              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processImage(file, "camera");
                }}
                className="hidden"
              />

              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="h-[1px] w-10 bg-gray-100" />
                <span className="text-[10px] font-black text-gray-300 tracking-widest uppercase">OR</span>
                <div className="h-[1px] w-10 bg-gray-100" />
              </div>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={cameraScanning || galleryScanning}
                className="mt-4 flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 text-xs font-bold hover:bg-gray-50 active:scale-95 transition-all"
              >
                {galleryScanning ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <Upload size={16} />
                )}
                {galleryScanning ? "Reading image..." : "Upload from Gallery"}
              </button>

              <input
                type="file"
                ref={galleryInputRef}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processImage(file, "gallery");
                }}
                className="hidden"
              />
            </motion.div>
          )}

          {activeTab === "voice" && (
            <motion.div
              key="voice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <InventoryVoiceRecorder onDataExtracted={triggerReview} />
            </motion.div>
          )}

          {activeTab === "paste" && (
            <motion.div
              key="paste"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <InventoryPasteBox onDataExtracted={triggerReview} />
            </motion.div>
          )}

          {/* NEW MANUAL TAB - Triggers the Multi-Item Modal Instantly! */}
          {activeTab === "manual" && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-16 h-16 bg-[#134e4a]/10 rounded-full flex items-center justify-center mb-4 text-[#134e4a]">
                  <PackagePlus size={32} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Manual Entry</h3>
                <p className="text-xs text-gray-500 mb-6 px-4">
                  Open the multi-item form to manually type in your new stock details.
                </p>
                <button
                  onClick={() => triggerReview([{ name: "", quantity: 1, buying_price: 0, selling_price: 0 }])}
                  className="w-full py-4 bg-[#134e4a] text-white rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-transform"
                >
                  Add products
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}