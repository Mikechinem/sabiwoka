"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, CheckCircle2, AlertCircle, Send } from "lucide-react";
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
        setDuration((d) => {
          if (d >= 59) {
            stopRecording();
            return 60;
          }
          return d + 1;
        });
      }, 1000);

    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Microphone permission denied. Please allow microphone access.");
      } else {
        setError("Could not access microphone.");
      }
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
      if (!user) { setError("Not logged in"); setState("preview"); return; }

      const total = parseFloat(preview.total_amount) || 0;
      const paid = parseFloat(preview.amount_paid) || 0;
      const paymentStatus = paid === 0 ? "unpaid" : paid >= total ? "paid" : "partial";

      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert({
          user_id: user.id,
          customer_name: preview.customer_name ?? "Unknown",
          customer_phone: preview.customer_phone ?? null,
          total_amount: total,
          amount_paid: paid,
          payment_status: paymentStatus,
          input_method: "voice",
          notes: preview.notes ?? null,
          sold_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (saleError) { setError(saleError.message); setState("preview"); return; }

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
          customer_name: preview.customer_name ?? "Unknown",
          customer_phone: preview.customer_phone ?? null,
          total_amount: total,
          amount_paid: paid,
          is_settled: false,
        });
      }

      setState("success");
      setTimeout(() => {
        setState("idle");
        setTranscript("");
        setPreview(null);
      }, 3000);

    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setState("preview");
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mic size={18} style={{ color: "#134e4a" }} />
          <h3 className="font-semibold text-gray-800 text-sm">Voice Log</h3>
        </div>
        <AnimatePresence>
          {state === "success" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-[#2eb966] text-xs font-medium"
            >
              <CheckCircle2 size={14} /> Sale saved!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-50 rounded-xl text-xs text-red-600"
        >
          <AlertCircle size={13} />
          {error}
        </motion.div>
      )}

      {/* Idle state */}
      {state === "idle" && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={startRecording}
          className="w-full h-14 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
          style={{ borderColor: "#134e4a30", color: "#134e4a" }}
        >
          <Mic size={18} />
          Hold to record a sale
        </motion.button>
      )}

      {/* Recording state */}
      {state === "recording" && (
        <div className="flex flex-col items-center gap-3 py-2">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "#134e4a" }}
          >
            <Mic size={24} className="text-white" />
          </motion.div>
          <p className="text-xs font-semibold text-gray-500">
            Recording... {duration}s
          </p>
          <p className="text-xs text-gray-400 text-center px-4">
            Speak naturally — e.g. "Sold red ankara to Monica for 15k, she paid 10k"
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-bold"
            style={{ background: "#ef4444" }}
          >
            <Square size={14} /> Stop Recording
          </motion.button>
        </div>
      )}

      {/* Processing state */}
      {state === "processing" && (
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#134e4a] rounded-full animate-spin" />
          <p className="text-xs text-gray-500">AI is processing your voice note...</p>
        </div>
      )}

      {/* Preview state */}
      {state === "preview" && preview && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {transcript && (
            <div className="mb-3 px-3 py-2 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-400 mb-1 font-medium">You said:</p>
              <p className="text-xs text-gray-700 italic">"{transcript}"</p>
            </div>
          )}

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              AI extracted — confirm before saving
            </p>
            <div className="space-y-1">
              {[
                { label: "Customer", value: preview.customer_name },
                { label: "Phone", value: preview.customer_phone },
                { label: "Item", value: preview.item_name },
                { label: "Total", value: preview.total_amount ? `₦${Number(preview.total_amount).toLocaleString()}` : null },
                { label: "Paid", value: `₦${Number(preview.amount_paid || 0).toLocaleString()}` },
                { label: "Balance", value: preview.total_amount ? `₦${(Number(preview.total_amount) - Number(preview.amount_paid || 0)).toLocaleString()}` : null },
                { label: "Notes", value: preview.notes },
              ].filter(item => item.value).map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-semibold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setState("idle")}
              className="flex-1 h-10 rounded-full border border-gray-200 text-xs font-semibold text-gray-500"
            >
              Record again
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleConfirm}
              className="flex-1 h-10 rounded-full text-white text-xs font-bold flex items-center justify-center gap-1.5"
              style={{ background: "#134e4a" }}
            >
              <Send size={13} /> Confirm & Save
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}