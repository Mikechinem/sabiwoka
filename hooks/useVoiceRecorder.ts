"use client";

import { useState, useRef } from "react";

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    chunksRef.current = [];
    
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = async (context: "sales" | "leads") => {
    // We return a NEW promise that only resolves when the FETCH is done
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) return resolve(undefined);

      mediaRecorderRef.current.onstop = async () => {
        setIsParsing(true);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");
        formData.append("context", context);

        try {
          const res = await fetch("/api/ai/voice-to-task", {
            method: "POST",
            body: formData,
          });
          
          if (!res.ok) throw new Error("Server error");
          
          const data = await res.json();
          console.log("Hook internal check:", data); // Check if data exists here
          resolve(data); // <--- Pass the data back to the component
        } catch (err) {
          console.error("Fetch error in hook:", err);
          resolve(undefined);
        } finally {
          setIsParsing(false);
        }
      };

      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    });
  };

  return { isRecording, isParsing, startRecording, stopRecording };
}