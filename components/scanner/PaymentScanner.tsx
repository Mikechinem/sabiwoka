"use client";
import { ScanResult } from "@/types/scan-result";
import { useRef, useState, useCallback } from "react";
import { Camera, RefreshCw, ShieldAlert, X, Loader2, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FakeAlertResult from "./FakeAlertResult";

export default function PaymentScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = async () => {
    setCameraActive(true);
    setResult(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (err) {
      alert("Camera access denied.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const sendToAI = async (base64Image: string) => {
    try {
      const response = await fetch("/api/ai/payment-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Scanner failed");
      }

      setResult(data);
      stopCamera();
    } catch (err: any) {
      console.error("Frontend Scan Error:", err.message);
      alert("Scanner error: " + err.message);
    } finally {
      setScanning(false);
    }
  };

  // --- REWRITTEN: Handle Gallery Upload ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setResult(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      // Send the full data URL to the backend
      const base64Image = reader.result as string; 
      await sendToAI(base64Image);
    };
    reader.readAsDataURL(file);
  };

  // --- REWRITTEN: Capture from Camera ---
  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setScanning(true);
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Set resolution based on actual video stream size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    // High quality capture (0.9) to preserve text clarity
    const base64Image = canvas.toDataURL("image/jpeg", 0.9);
    
    await sendToAI(base64Image);
  }, [videoRef, canvasRef, stream]);

  return (
    <div className="w-full space-y-4">
    {/* INITIAL BUTTONS */}
{!cameraActive && !result && (
  <div className="grid grid-cols-1 gap-3">
    <button
      onClick={startCamera}
      className="w-full py-10 border-2 border-[#134e4a] border-dashed rounded-[2.5rem] flex flex-col items-center justify-center gap-2 text-[#134e4a] bg-teal-50/30"
    >
      <Camera size={28} />
      <span className="text-xs font-black uppercase tracking-widest">Use Live Camera</span>
    </button>

    <button
      type="button" // ALIGNMENT: Explicitly set type to button to prevent form submission issues
      onClick={() => fileInputRef.current?.click()}
      disabled={scanning} // Prevent double-clicks while scanning
      className="w-full py-6 border-2 border-gray-100 rounded-[2rem] flex items-center justify-center gap-3 text-gray-500 bg-white shadow-sm active:bg-gray-50 transition-colors"
    >
      {scanning ? (
        <RefreshCw className="animate-spin text-teal-600" size={20} />
      ) : (
        <ImageIcon size={20} />
      )}
      <span className="text-xs font-black uppercase tracking-widest">
        {scanning ? "Reading Receipt..." : "Upload from Gallery"}
      </span>
    </button>

    <input 
      type="file" 
      ref={fileInputRef} 
      onChange={handleFileUpload} 
      accept="image/*" 
      className="hidden" 
      /* Key Fix: Reset value after change so the same file can be uploaded twice if needed */
      onClick={(e) => ((e.target as HTMLInputElement).value = "")}
    />
  </div>
)}
      {/* CAMERA MODAL */}
      <AnimatePresence>
        {cameraActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black flex flex-col">
            <div className="relative flex-1 flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
              <div className="absolute inset-0 border-[40px] border-black/60 pointer-events-none">
                <div className="w-full h-full border-2 border-white/30 rounded-3xl relative">
                   <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-teal-400 rounded-tl-xl" />
                   <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-teal-400 rounded-tr-xl" />
                   {scanning && (
                     <motion.div animate={{ top: ["5%", "95%", "5%"] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute left-0 right-0 h-1 bg-teal-400 shadow-[0_0_20px_rgba(45,212,191,1)]" />
                   )}
                </div>
              </div>
              <button onClick={stopCamera} className="absolute top-12 right-6 p-3 bg-white/20 backdrop-blur-md rounded-full text-white"><X size={24} /></button>
            </div>
            <div className="p-12 bg-black flex justify-center pb-20">
              <button onClick={captureAndScan} disabled={scanning} className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-8 border-white/20">
                {scanning ? <Loader2 className="animate-spin text-[#134e4a]" /> : <div className="w-14 h-14 bg-[#134e4a] rounded-full" />}
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESULTS DISPLAY */}
      {result && (
        <FakeAlertResult 
          result={result} 
          onReset={() => setResult(null)} 
        />
      )}
    </div>
  );
}