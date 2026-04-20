"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  RotateCcw, 
  Loader2 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

type UIState = "idle" | "recording" | "processing" | "preview" | "saving" | "success";

export default function LeadVoiceRecorder() {
  const { isRecording, isParsing, startRecording, stopRecording } = useVoiceRecorder();
  
  const [uiState, setUiState] = useState<UIState>("idle");
  const [transcript, setTranscript] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState("");
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const updatePreview = (key: string, value: string | number) => {
    setPreview((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleStart = async () => {
    setError("");
    setTranscript("");
    setPreview(null);
    setUiState("recording");
    setDuration(0);
    
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);

    await startRecording();
  };

  const handleStop = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setUiState("processing");
    
    const data: any = await stopRecording("leads"); 
    
    if (data && (data.lead || data.success)) {
      setTranscript(data.transcript || "");
      setPreview(data.lead || data); 
      setUiState("preview");
    } else {
      setError("AI failed to parse lead details.");
      setUiState("idle");
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setUiState("saving");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error: leadError } = await supabase
        .from("leads")
        .insert({
          user_id: user.id,
          full_name: preview.full_name || "Unknown Prospect",
          phone: preview.phone || null,
          item_of_interest: preview.item_of_interest || null,
          amount: parseFloat(preview.amount || "0"),
          notes: preview.notes || null,
          status: "interested",
          input_method: "voice",
        });

      if (leadError) throw leadError;

      setUiState("success");
      setTimeout(() => {
        setUiState("idle");
        setPreview(null);
      }, 3000);

    } catch (err: any) {
      setError(err.message);
      setUiState("preview");
    }
  };

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
          {uiState === "success" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-[#2eb966] text-[10px] font-black uppercase">
              <CheckCircle2 size={12} /> Lead Saved!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-50 rounded-xl text-[11px] text-red-600 font-medium">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {uiState === "idle" && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          className="w-full h-14 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center gap-2 text-sm font-bold text-[#134e4a] hover:bg-gray-50 transition-colors"
        >
          <Mic size={18} /> Tap to Record Lead
        </motion.button>
      )}

      {uiState === "recording" && (
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="relative">
            <motion.div 
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }} 
              transition={{ repeat: Infinity, duration: 1.5 }} 
              className="absolute inset-0 bg-[#134e4a] rounded-full" 
            />
            <div className="relative w-16 h-16 rounded-full bg-[#134e4a] flex items-center justify-center text-white">
              <Mic size={24} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-gray-900">{duration}s</p>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Listening...</p>
          </div>
          <button onClick={handleStop} className="px-8 py-3 rounded-full bg-red-500 text-white text-xs font-black uppercase shadow-lg">
            Finish Recording
          </button>
        </div>
      )}

      {(uiState === "processing" || isParsing) && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="animate-spin text-[#134e4a]" size={24} />
          <p className="text-xs font-bold text-gray-400 uppercase">AI is analyzing lead...</p>
        </div>
      )}

      {(uiState === "preview" || uiState === "saving") && preview && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="px-3 py-2 bg-gray-50 rounded-xl mb-4">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Transcript</p>
            <p className="text-xs text-gray-600 italic">"{transcript}"</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: "Customer Name", key: "full_name", type: "text" },
              { label: "Phone Number", key: "phone", type: "tel" },
              { label: "Item of Interest", key: "item_of_interest", type: "text" },
              { label: "Proposed Price", key: "amount", type: "number" },
              { label: "Notes", key: "notes", type: "text" },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 block">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={preview[field.key] || ""}
                  onChange={(e) => updatePreview(field.key, e.target.value)}
                  className="w-full h-11 px-4 bg-gray-50 rounded-xl text-sm font-semibold text-gray-800 border border-transparent focus:border-[#134e4a] focus:bg-white outline-none transition-all"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              onClick={() => setUiState("idle")} 
              disabled={uiState === "saving"}
              className="flex-1 h-12 rounded-xl bg-gray-100 text-gray-500 text-xs font-bold uppercase flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} /> Redo
            </button>
            <button 
              onClick={handleConfirm} 
              disabled={uiState === "saving"} 
              className="flex-[2] h-12 rounded-xl bg-[#134e4a] text-white text-xs font-bold uppercase flex items-center justify-center gap-2 shadow-lg shadow-[#134e4a]/20"
            >
              {uiState === "saving" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Save Lead
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}