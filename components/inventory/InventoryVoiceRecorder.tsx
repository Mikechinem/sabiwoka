"use client";
import { useState, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { transcribeAudio, parseVoiceTranscript } from "@/lib/groq/voice-parser";

interface Props {
  onDataExtracted: (items: any[]) => void;
}

export default function InventoryVoiceRecorder({ onDataExtracted }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await processAudio(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Mic access is required for voice recording.");
    }
  };

  const processAudio = async (blob: Blob) => {
    setLoading(true);
    try {
      const file = new File([blob], "input.wav", { type: "audio/wav" });
      
      // 1. Get Text from Speech
      const text = await transcribeAudio(file);
      
      // 2. Get Data from Text
      const data = await parseVoiceTranscript(text, 'inventory');
      
      if (data?.items) onDataExtracted(data.items);
    } catch (error) {
      console.error(error);
      alert("Error processing voice. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <button
        onClick={() => isRecording ? mediaRecorderRef.current?.stop() : startRecording()}
        disabled={loading}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl ${
          isRecording ? "bg-red-500 animate-pulse" : "bg-[#134e4a]"
        } text-white disabled:opacity-50`}
      >
        {isRecording ? <Square size={32} /> : <Mic size={32} />}
      </button>
      
      <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
        {isRecording ? "Recording..." : loading ? "AI is Thinking..." : "Tap to record restock"}
      </p>

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-[#134e4a] font-bold text-xs">
          <Loader2 className="animate-spin" size={14} /> 
          Processing Audio...
        </div>
      )}
    </div>
  );
}