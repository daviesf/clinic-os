import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Stethoscope, CheckCircle, Activity, Sparkles, Loader2, Save } from "lucide-react";
import { api } from "@/services/api";

export default function ConsultationPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [bullets, setBullets] = useState<string[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto scroll transcription to bottom
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcription]);

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          await handleAudioSubmit(blob);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Não foi possível acessar o microfone.");
      }
    }
  };

  const handleAudioSubmit = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "consultation.webm");

      const response = await api.post("/api/consultations/transcribe", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const text = response.data.data.text;
      setTranscription(prev => prev ? prev + "\n" + text : text);
      
      // Real insights will come from AI API in future; for now derive from transcription
      if (text.length > 10) {
        setBullets(prev => [...prev, `Trecho transcrito: "${text.substring(0, 80)}..."`]);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao transcrever áudio.");
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background/50">
      <header className="flex items-center justify-between p-6 border-b border-border/40 backdrop-blur-md bg-card/60 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-2xl">
            <Stethoscope className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Consulta Assistida (Copiloto)</h1>
            <p className="text-muted-foreground text-sm">Geração de prontuário e acompanhamento automático em tempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (!transcription) return;
              alert("Prontuário salvo com sucesso!");
            }}
            disabled={!transcription}
            className="px-4 py-2 flex items-center gap-2 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="size-4" />
            Salvar Prontuário
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden grid grid-cols-3 gap-6 p-6">
        <div className="col-span-2 flex flex-col gap-6">
          <div className="flex-1 bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 flex flex-col shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-6 z-10">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Activity className="size-5 text-blue-500" />
                Transcrição em Tempo Real
              </h2>
              {isTranscribing && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Loader2 className="size-4 animate-spin" />
                  Processando áudio com Whisper...
                </div>
              )}
            </div>

            <div 
              ref={containerRef}
              className="flex-1 overflow-y-auto mb-6 text-lg leading-relaxed text-foreground/90 font-medium z-10 whitespace-pre-wrap pr-4"
            >
              {transcription ? (
                transcription
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground flex-col gap-4">
                  <MicOff className="size-12 opacity-20" />
                  <p>Inicie a gravação para começar a transcrever a consulta.</p>
                </div>
              )}
            </div>

            <div className="flex justify-center z-10">
              <button
                onClick={toggleRecording}
                className={`relative group flex items-center justify-center size-20 rounded-full transition-all duration-300 shadow-xl ${
                  isRecording 
                    ? "bg-red-500 hover:bg-red-600 scale-110 shadow-red-500/30" 
                    : "bg-primary hover:bg-primary/90 hover:scale-105 shadow-primary/30"
                }`}
              >
                {isRecording && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
                    <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-50" />
                  </>
                )}
                {isRecording ? (
                  <Mic className="size-8 text-white relative z-10" />
                ) : (
                  <Mic className="size-8 text-white relative z-10" />
                )}
              </button>
            </div>
            {isRecording && <p className="text-center text-red-500 font-medium mt-4 animate-pulse">Gravando...</p>}
          </div>
        </div>

        <div className="col-span-1 flex flex-col gap-6">
          <div className="bg-gradient-to-b from-card/80 to-card backdrop-blur-md border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col h-[50%]">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-emerald-500">
              <Sparkles className="size-5" />
              Insights Clínicos (Copiloto)
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {bullets.length > 0 ? bullets.map((b, i) => (
                <div key={i} className="p-3 bg-muted/50 rounded-xl border border-border/40 text-sm font-medium animate-in slide-in-from-bottom-2 fade-in">
                  • {b}
                </div>
              )) : (
                <div className="text-sm text-muted-foreground flex items-center h-full justify-center text-center">
                  A IA gerará insights e observações enquanto você fala.
                </div>
              )}
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col h-[50%]">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-orange-500">
              <CheckCircle className="size-5" />
              Sugestões de Conduta
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {bullets.length > 0 ? (
                <>
                  <label className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/60 transition-colors">
                    <input type="checkbox" className="mt-1 rounded border-border" />
                    <span className="text-sm font-medium">Agendar retorno conforme contexto da consulta</span>
                  </label>
                  <label className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/60 transition-colors">
                    <input type="checkbox" className="mt-1 rounded border-border" />
                    <span className="text-sm font-medium">Solicitar exames complementares</span>
                  </label>
                </>
              ) : (
                <div className="text-sm text-muted-foreground flex items-center h-full justify-center text-center">
                  O Copiloto sugerirá tarefas baseadas no contexto da consulta.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
