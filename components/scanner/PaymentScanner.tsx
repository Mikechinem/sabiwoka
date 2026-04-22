"use client";

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
  const [result, setResult] = useState<any>(null);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setResult(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = (reader.result as string).split(",")[1];
      await sendToAI(base64Image);
    };
    reader.readAsDataURL(file);
  };

  const sendToAI = async (base64Image: string) => {
    try {
      const response = await fetch("/api/ai/payment-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await response.json();
      setResult(data);
      stopCamera();
    } catch (err) {
      alert("Scanner error. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setScanning(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);
    const base64Image = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
    await sendToAI(base64Image);
  }, [stream]);

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
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-6 border-2 border-gray-100 rounded-[2rem] flex items-center justify-center gap-3 text-gray-500 bg-white shadow-sm"
          >
            {scanning ? <Loader2 className="animate-spin" size={20} /> : <ImageIcon size={20} />}
            <span className="text-xs font-black uppercase tracking-widest">Upload from Gallery</span>
          </button>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
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

      {/* RESULTS DISPLAY - Using the new FakeAlertResult component */}
      {result && (
        <FakeAlertResult 
          result={result} 
          onReset={() => setResult(null)} 
        />
      )}
    </div>
  );
}