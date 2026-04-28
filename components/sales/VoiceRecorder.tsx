"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from "lucide-react";

type RecordingState = "idle" | "recording" | "processing" | "success";

interface Props {
  onDataExtracted?: (data: any) => void;
}

export default function VoiceRecorder({ onDataExtracted }: Props) {
  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState("");
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  async function startRecording() {
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      audioChunks.current = [];
      setDuration(0);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setState("processing");

        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("context", "sales");

        try {
          const response = await fetch("/api/ai/voice-to-task", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            setError(data.error || "Voice processing failed");
            setState("idle");
            return;
          }

          // MAGIC: Pass data to the main form instead of handling it locally!
          if (onDataExtracted) {
             onDataExtracted(data.sale);
          }

          setState("success");
          setTimeout(() => setState("idle"), 3000);

        } catch (err: any) {
          setError(err.message || "Something went wrong");
          setState("idle");
        }
      };

      recorder.start();
      setState("recording");

      timerRef.current = setInterval(() => {
        setDuration((d) => (d >= 59 ? (stopRecording(), 60) : d + 1));
      }, 1000);

    } catch (err: any) {
      setError(err.name === "NotAllowedError" ? "Microphone access denied." : "Could not access microphone.");
    }
  }

  function stopRecording() {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#134e4a]/10 flex items-center justify-center text-[#134e4a]">
            <Mic size={14} />
          </div>
          <h3 className="font-bold text-gray-800 text-sm">Voice Recorder</h3>
        </div>
        <AnimatePresence>
          {state === "success" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-[#2eb966] text-[10px] font-black uppercase">
              <CheckCircle2 size={12} /> Ready for review!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-50 rounded-xl text-[11px] text-red-600 font-medium">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {state === "idle" && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={startRecording}
          className="w-full h-14 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center gap-2 text-sm font-bold text-[#134e4a] hover:bg-gray-50 transition-colors"
        >
          <Mic size={18} /> Tap to Record Sale
        </motion.button>
      )}

      {state === "recording" && (
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="relative">
            <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 bg-[#134e4a] rounded-full" />
            <div className="relative w-16 h-16 rounded-full bg-[#134e4a] flex items-center justify-center text-white">
              <Mic size={24} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-gray-900">{duration}s</p>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Listening...</p>
          </div>
          <button onClick={stopRecording} className="px-8 py-3 rounded-full bg-red-500 text-white text-xs font-black uppercase shadow-lg">
            Finish Recording
          </button>
        </div>
      )}

      {state === "processing" && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="animate-spin text-[#134e4a]" size={24} />
          <p className="text-xs font-bold text-gray-400 uppercase">Analyzing your voice...</p>
        </div>
      )}
    </div>
  );
}