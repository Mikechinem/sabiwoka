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
  
  // Separate loading states so the user knows which button is working
  const [cameraScanning, setCameraScanning] = useState(false);
  const [galleryScanning, setGalleryScanning] = useState(false);
  
  // Two explicit, separate inputs
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

  // One shared function to handle the image once it's picked/snapped
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
        // Reset both inputs so they can be clicked again
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

              {/* BUTTON 1: CAMERA */}
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

              {/* INPUT 1: STRICTLY CAMERA */}
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment" // Forces the back camera on mobile
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

              {/* BUTTON 2: GALLERY */}
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

              {/* INPUT 2: STRICTLY GALLERY */}
              <input
                type="file"
                ref={galleryInputRef}
                accept="image/*"
                // Notice there is NO capture attribute here
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

          {activeTab === "manual" && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="space-y-4">
                <input
                  id="manual-name"
                  placeholder="Product Name"
                  className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold border-none outline-none focus:ring-2 focus:ring-[#134e4a]/20 transition-all placeholder:font-medium"
                />
                <div className="flex gap-2">
                  <input
                    id="manual-qty"
                    placeholder="Qty"
                    type="number"
                    className="w-1/3 p-4 bg-gray-50 rounded-2xl text-sm font-bold border-none outline-none focus:ring-2 focus:ring-[#134e4a]/20 transition-all placeholder:font-medium"
                  />
                  <input
                    id="manual-cost"
                    placeholder="Cost (₦)"
                    type="number"
                    className="w-2/3 p-4 bg-gray-50 rounded-2xl text-sm font-bold border-none outline-none focus:ring-2 focus:ring-[#134e4a]/20 transition-all placeholder:font-medium"
                  />
                </div>
                <button
                  onClick={() => {
                    const name = (document.getElementById("manual-name") as HTMLInputElement).value;
                    const qty = (document.getElementById("manual-qty") as HTMLInputElement).value;
                    const cost = (document.getElementById("manual-cost") as HTMLInputElement).value;
                    if (!name || !qty || !cost) return alert("Fill all fields");
                    triggerReview([{
                      name,
                      quantity: parseInt(qty),
                      buying_price: parseInt(cost),
                      selling_price: parseInt(cost) * 1.5,
                    }]);
                  }}
                  className="w-full py-4 bg-[#134e4a] text-white rounded-2xl font-black text-sm mt-2 shadow-lg active:scale-95 transition-transform"
                >
                  Review & Add Stock
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}