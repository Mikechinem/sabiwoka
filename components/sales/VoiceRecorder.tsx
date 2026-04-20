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
  Loader2 // Added missing import
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type RecordingState = "idle" | "recording" | "processing" | "preview" | "saving" | "success";

export default function VoiceRecorder() {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState("");
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const updatePreview = (key: string, value: string | number) => {
    setPreview((prev: any) => ({ ...prev, [key]: value }));
  };

  async function startRecording() {
    setError("");
    setTranscript("");
    setPreview(null);

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

          setTranscript(data.transcript);
          setPreview(data.sale);
          setState("preview");

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

  async function handleConfirm() {
    if (!preview) return;
    setState("saving");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const total = parseFloat(preview.total_amount) || 0;
      const paid = parseFloat(preview.amount_paid) || 0;
      const paymentStatus = paid === 0 ? "unpaid" : paid >= total ? "paid" : "partial";

      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert({
          user_id: user.id,
          customer_name: preview.customer_name || "Walk-in Customer",
          customer_phone: preview.customer_phone || null,
          total_amount: total,
          amount_paid: paid,
          payment_status: paymentStatus,
          input_method: "voice",
          notes: preview.notes || null,
          sold_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (saleError) throw saleError;

      if (preview.item_name) {
        await supabase.from("sale_items").insert({
          sale_id: saleData.id,
          product_name: preview.item_name,
          quantity: 1,
          unit_price: total,
        });
      }

      if (paymentStatus !== "paid") {
        await supabase.from("debts").insert({
          user_id: user.id,
          sale_id: saleData.id,
          customer_name: preview.customer_name || "Walk-in Customer",
          customer_phone: preview.customer_phone || null,
          total_amount: total,
          amount_paid: paid,
          is_settled: false,
        });
      }

      setState("success");
      setTimeout(() => {
        setState("idle");
        setPreview(null);
      }, 3000);

    } catch (err: any) {
      setError(err.message);
      setState("preview");
    }
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
              <CheckCircle2 size={12} /> Saved!
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

      {/* Logic fix here: checking for 'preview' OR 'saving' to avoid TypeScript union overlap errors */}
      {(state === "preview" || state === "saving") && preview && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="px-3 py-2 bg-gray-50 rounded-xl mb-4">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Transcript</p>
            <p className="text-xs text-gray-600 italic">"{transcript}"</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: "Customer Name", key: "customer_name", type: "text" },
              { label: "Phone Number", key: "customer_phone", type: "tel" },
              { label: "Item Sold", key: "item_name", type: "text" },
              { label: "Total Amount", key: "total_amount", type: "number" },
              { label: "Amount Paid", key: "amount_paid", type: "number" },
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
                  placeholder={`Edit ${field.label.toLowerCase()}...`}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              onClick={() => setState("idle")} 
              disabled={state === "saving"}
              className="flex-1 h-12 rounded-xl bg-gray-100 text-gray-500 text-xs font-bold uppercase flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} /> Redo
            </button>
            <button 
              onClick={handleConfirm} 
              disabled={state === "saving"} 
              className="flex-[2] h-12 rounded-xl bg-[#134e4a] text-white text-xs font-bold uppercase flex items-center justify-center gap-2 shadow-lg shadow-[#134e4a]/20"
            >
              {state === "saving" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Confirm Sale
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}