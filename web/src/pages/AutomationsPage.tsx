import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Zap, Clock, Plus, ArrowLeft, Trash2, CalendarClock, MessageSquare } from "lucide-react";
import { api } from "../services/api";

export default function AutomationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [triggerAt, setTriggerAt] = useState("");
  const [intent, setIntent] = useState("");

  const { data: followUps, isLoading } = useQuery({
    queryKey: ["automations"],
    queryFn: async () => {
      const res = await api.get("/api/automations");
      return res.data.data;
    }
  });

  const { data: patients } = useQuery({
    queryKey: ["patients-list"],
    queryFn: async () => {
      const res = await api.get("/api/patients");
      return res.data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post("/api/automations", {
        patientId,
        triggerAt,
        intent
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      setIsModalOpen(false);
      setPatientId("");
      setTriggerAt("");
      setIntent("");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/automations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    }
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card shrink-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="size-6 text-amber-500" /> Automações & Gatilhos
            </h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="size-4" /> Novo Gatilho
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : followUps?.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-xl border border-border shadow-sm">
              <Clock className="size-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="text-lg font-medium">Nenhum gatilho configurado</h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Crie lembretes de retorno, confirmações de consulta ou follow-ups automáticos. A IA enviará a mensagem no momento exato.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 text-primary font-medium hover:underline"
              >
                Criar primeira automação
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {followUps?.map((item: any) => (
                <div key={item.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
                      <CalendarClock className="size-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'PENDING' ? 'bg-blue-500/10 text-blue-500' :
                        item.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {item.status}
                      </span>
                      <button
                        onClick={() => deleteMutation.mutate(item.id)}
                        className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-1 truncate">{item.patient?.name || item.patient?.phone}</h3>
                  <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                    <MessageSquare className="size-3" />
                    Intent: {item.intent}
                  </p>
                  
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <span className="block text-xs text-muted-foreground mb-1">Gatilho programado para:</span>
                    <span className="font-medium">{new Date(item.triggerAt).toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-lg">
            <h2 className="text-xl font-bold mb-6">Criar Gatilho de IA</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Paciente Alvo</label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Selecione um paciente...</option>
                  {patients?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name ? `${p.name} (${p.phone})` : p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Data e Hora do Gatilho</label>
                <input
                  type="datetime-local"
                  value={triggerAt}
                  onChange={(e) => setTriggerAt(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Intenção / Instrução para IA</label>
                <textarea
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-y"
                  placeholder="Ex: Perguntar se o paciente tomou o remédio e se a dor melhorou."
                />
                <p className="text-xs text-muted-foreground mt-1">A IA usará esta instrução para redigir e enviar a mensagem no momento programado.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !patientId || !triggerAt || !intent}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? "Salvando..." : "Programar Gatilho"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
