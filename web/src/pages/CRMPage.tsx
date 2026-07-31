
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PieChart, Target, Zap, ArrowLeft, Clock, MessageSquare, CheckCircle, Plus } from "lucide-react";
import { api } from "../services/api";

export default function CRMPage() {
  const navigate = useNavigate();

  const { data: followUps, isLoading } = useQuery({
    queryKey: ["automations"],
    queryFn: async () => {
      const res = await api.get("/api/automations");
      return res.data.data;
    }
  });

  const columns = [
    { id: "PENDING", title: "Em Andamento (IA)", icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { id: "SENT", title: "Contatado (Convertido)", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { id: "CANCELLED", title: "Perdido / Cancelado", icon: Target, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" }
  ];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card shrink-0">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <PieChart className="size-6 text-primary" /> CRM & Copiloto Comercial
              </h1>
              <p className="text-sm text-muted-foreground">Monitoramento de leads, retornos e propensão de compra gerenciados pela IA</p>
            </div>
          </div>
          <button 
            onClick={() => navigate("/automations")}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="size-4" /> Nova Oportunidade
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6 flex justify-center">
        <div className="max-w-[1400px] w-full flex gap-6 min-w-max h-full">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-muted-foreground">Carregando pipeline...</div>
            </div>
          ) : (
            columns.map(col => {
              const items = followUps?.filter((f: any) => f.status === col.id) || [];
              return (
                <div key={col.id} className="flex-1 min-w-[320px] max-w-[400px] flex flex-col h-full bg-card/50 rounded-2xl border border-border overflow-hidden">
                  <div className={`p-4 border-b border-border flex items-center justify-between ${col.bg}`}>
                    <h3 className={`font-semibold flex items-center gap-2 ${col.color}`}>
                      <col.icon className="size-5" /> {col.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.color} bg-background/50 border ${col.border}`}>
                      {items.length}
                    </span>
                  </div>
                  
                  <div className="flex-1 p-3 overflow-y-auto space-y-3">
                    {items.length === 0 ? (
                      <div className="text-center p-6 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                        Nenhuma oportunidade nesta etapa.
                      </div>
                    ) : (
                      items.map((item: any) => (
                        <div key={item.id} className="bg-background border border-border rounded-xl p-4 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-medium bg-muted px-2 py-1 rounded text-muted-foreground">
                              {new Date(item.triggerAt).toLocaleDateString()}
                            </span>
                            <Zap className="size-4 text-amber-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <h4 className="font-semibold text-foreground mb-1 truncate">
                            {item.patient?.name || item.patient?.phone}
                          </h4>
                          <p className="text-xs text-muted-foreground flex items-start gap-1.5 line-clamp-2">
                            <MessageSquare className="size-3 mt-0.5 shrink-0" />
                            {item.intent}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
