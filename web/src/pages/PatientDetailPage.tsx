import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Brain, Calendar, Activity, Clock, ShieldAlert, CheckCircle, FileAudio } from "lucide-react";
import { api } from "@/services/api";

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await api.get(`/api/patients/${id}/360`);
        setData(response.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando dados do paciente...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500">Paciente não encontrado.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-background/50 overflow-hidden">
      <header className="flex items-center gap-4 p-6 border-b border-border/40 backdrop-blur-md bg-card/60 sticky top-0 z-10 shrink-0">
        <button onClick={() => navigate("/patients")} className="p-2 hover:bg-muted rounded-xl transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{data.patient.name || "Sem Nome"}</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            {data.patient.phone}
            <span className="text-border">•</span>
            {data.patient.lgpdConsent ? (
              <span className="text-emerald-500 flex items-center gap-1"><CheckCircle className="size-3" /> LGPD OK</span>
            ) : (
              <span className="text-amber-500 flex items-center gap-1"><ShieldAlert className="size-3" /> LGPD Pendente</span>
            )}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-6">
          <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-6 text-primary">
              <Activity className="size-5" />
              Timeline Longitudinal
            </h2>
            <div className="relative border-l-2 border-border/50 ml-4 space-y-8 pb-4">
              {data.appointments?.map((apt: any) => (
                <div key={apt.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1.5 size-4 rounded-full bg-emerald-500/20 border-2 border-emerald-500" />
                  <div className="bg-muted/30 p-4 rounded-2xl border border-border/40">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="size-4" />
                      {new Date(apt.date).toLocaleDateString("pt-BR")} às {new Date(apt.date).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <h3 className="font-medium text-foreground">Consulta ({apt.status})</h3>
                  </div>
                </div>
              ))}
              
              {data.episodicMemories?.map((mem: any) => (
                <div key={mem.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1.5 size-4 rounded-full bg-blue-500/20 border-2 border-blue-500" />
                  <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/20">
                    <div className="flex items-center gap-2 text-sm text-blue-500/70 mb-2">
                      <FileAudio className="size-4" />
                      Resumo da Interação • {new Date(mem.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{mem.summary}</p>
                  </div>
                </div>
              ))}
              
              {(!data.appointments?.length && !data.episodicMemories?.length) && (
                <div className="pl-6 text-muted-foreground text-sm">Nenhum evento registrado ainda.</div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-1 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-indigo-500">
              <Brain className="size-5" />
              Memória Semântica (IA)
            </h2>
            <div className="space-y-3">
              {data.semanticMemories?.length > 0 ? (
                data.semanticMemories.map((mem: any) => (
                  <div key={mem.id} className="p-3 bg-background/50 rounded-xl border border-indigo-500/10 text-sm">
                    {mem.content}
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">Nenhum fato aprendido ainda.</div>
              )}
            </div>
          </div>
          
          <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-orange-500">
              <Clock className="size-5" />
              Follow-ups Pendentes
            </h2>
            <div className="space-y-3">
              {data.followUps?.length > 0 ? (
                data.followUps.map((fu: any) => (
                  <div key={fu.id} className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 text-sm">
                    <div className="font-medium text-orange-600 mb-1">{fu.intent}</div>
                    <div className="text-xs text-orange-600/70">
                      Gatilho: {new Date(fu.triggerAt).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">Nenhum follow-up agendado.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
