"use client";

import { useRef, useState, useCallback } from "react";
import { Camera, RefreshCw, ShieldCheck, ShieldAlert, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PaymentScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // 1. Start Camera
  const startCamera = async () => {
    setCameraActive(true);
    setResult(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Standard for "Point and shoot" mobile usage
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (err) {
      console.error("Camera Error:", err);
      alert("Sabi Scanner needs camera access to work. Please check your settings.");
      setCameraActive(false);
    }
  };

  // 2. Stop Camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // 3. Capture Frame and Send to AI
  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setScanning(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Set canvas dimensions to match video stream
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);

    // Convert to Base64 (Compressed for speed)
    const base64Image = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];

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
      alert("Scanner network error. Please try again.");
    } finally {
      setScanning(false);
    }
  }, [stream]);

  return (
    <div className="w-full space-y-4">
      {/* INITIAL BUTTON */}
      {!cameraActive && !result && (
        <button
          onClick={startCamera}
          className="w-full py-12 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-[#134e4a] hover:text-[#134e4a] transition-all bg-white shadow-sm"
        >
          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-2">
            <Camera size={28} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest">Tap to Scan Receipt</span>
          <p className="text-[10px] opacity-60 font-medium">Verify transfers & detect fakes</p>
        </button>
      )}

      {/* LIVE CAMERA MODAL */}
      <AnimatePresence>
        {cameraActive && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black flex flex-col"
          >
            <div className="relative flex-1 flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="h-full w-full object-cover"
              />
              
              {/* Sabi Overlay */}
              <div className="absolute inset-0 border-[40px] border-black/60 pointer-events-none">
                <div className="w-full h-full border-2 border-white/30 rounded-3xl relative">
                   <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-teal-400 rounded-tl-xl" />
                   <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-teal-400 rounded-tr-xl" />
                   <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-teal-400 rounded-bl-xl" />
                   <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-teal-400 rounded-br-xl" />
                   
                   {scanning && (
                     <motion.div 
                       animate={{ top: ["5%", "95%", "5%"] }}
                       transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                       className="absolute left-0 right-0 h-1 bg-teal-400 shadow-[0_0_20px_rgba(45,212,191,1)]"
                     />
                   )}
                </div>
              </div>
              
              <button 
                onClick={stopCamera} 
                className="absolute top-12 right-6 p-3 bg-white/20 backdrop-blur-md rounded-full text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Shutter Button Section */}
            <div className="p-12 bg-black flex justify-center items-center pb-20">
              <button 
                onClick={captureAndScan} 
                disabled={scanning}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-8 border-white/20 active:scale-90 transition-transform"
              >
                {scanning ? (
                  <Loader2 className="animate-spin text-[#134e4a]" size={32} />
                ) : (
                  <div className="w-14 h-14 bg-[#134e4a] rounded-full shadow-inner" />
                )}
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESULTS DISPLAY */}
      {result && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          className="bg-white rounded-[2.5rem] p-7 border border-gray-100 shadow-2xl relative overflow-hidden"
        >
          <div className={`absolute top-0 left-0 right-0 h-2 ${result.verdict === 'REAL' ? 'bg-green-500' : 'bg-red-500'}`} />
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Analysis Complete</p>
              <h3 className={`text-2xl font-black leading-none ${result.verdict === 'REAL' ? 'text-green-600' : 'text-red-600'}`}>
                {result.verdict === 'REAL' ? 'Money is Sabi! ✅' : 'Warning: High Risk ❌'}
              </h3>
            </div>
            <button onClick={() => setResult(null)} className="p-2 bg-gray-50 rounded-full text-gray-400"><X size={20}/></button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-5 rounded-[1.8rem]">
              <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Amount Found</p>
              <p className="text-xl font-black text-gray-900">₦{Number(result.amount || 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-5 rounded-[1.8rem]">
              <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Bank Source</p>
              <p className="text-sm font-bold text-gray-700 leading-tight">{result.bankName || "Unknown"}</p>
            </div>
          </div>

          {result.redFlags?.length > 0 && (
            <div className="bg-red-50 p-5 rounded-[1.8rem] mb-6">
              <div className="flex items-center gap-2 text-red-600 mb-3">
                <ShieldAlert size={16} />
                <p className="text-[10px] font-black uppercase tracking-widest">Fraud Red Flags</p>
              </div>
              <ul className="space-y-2">
                {result.redFlags.map((flag: string, i: number) => (
                  <li key={i} className="text-[12px] text-red-500 font-bold leading-tight flex items-start gap-2">
                    <span className="mt-1 w-1 h-1 rounded-full bg-red-400 shrink-0" /> {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <button 
              onClick={startCamera} 
              className="w-full py-4 bg-[#134e4a] text-white rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-2 shadow-lg"
            >
              <RefreshCw size={14} /> Scan Another Receipt
            </button>
            <p className="text-center text-[10px] text-gray-300 font-medium">Results are AI-generated. Always confirm in-app.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}