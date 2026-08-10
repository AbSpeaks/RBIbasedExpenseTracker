"use client";
import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

// SpeechRecognition type declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const { toast: showToast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-IN"; // English India by default, or user's locale

        recognitionRef.current.onstart = () => {
          setIsRecording(true);
        };

        recognitionRef.current.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript;
          setIsRecording(false);
          await processVoiceTransaction(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
          if (event.error !== "no-speech") {
            showToast(`Voice Error: ${event.error}`, "error");
          }
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      } else {
        setIsSupported(false);
      }
    }
  }, []);

  const processVoiceTransaction = async (text: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process voice transaction");

      showToast(`Added: ${data.transaction.description} (₹${data.transaction.amount})`, "success");
      
      // Attempt to refresh the page/data globally (simple reload for now to reflect new data)
      setTimeout(() => window.location.reload(), 1500);
      
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (!isSupported) {
      showToast("Voice recognition is not supported in this browser.", "error");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        // Handle case where recognition is already started
        console.error(e);
      }
    }
  };

  if (!isSupported) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 flex items-center justify-center">
      {isRecording && (
        <div className="absolute inset-0 bg-[#D4AF37] rounded-full animate-ping opacity-30" />
      )}
      <button
        onClick={toggleRecording}
        disabled={isProcessing}
        className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all ${
          isRecording 
            ? "bg-[#EF4444] text-[#F8FAFC] scale-110" 
            : "bg-[#D4AF37] text-[#070D19] hover:bg-[#F59E0B]"
        }`}
      >
        {isProcessing ? (
          <Loader2 size={24} className="animate-spin" />
        ) : isRecording ? (
          <MicOff size={24} />
        ) : (
          <Mic size={24} />
        )}
      </button>
    </div>
  );
}
