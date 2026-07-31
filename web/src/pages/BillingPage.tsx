import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CreditCard, ArrowLeft, CheckCircle2, Zap, Shield, AlertCircle, Loader2 } from "lucide-react";
import { api } from "../services/api";

export default function BillingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { data: statusData, isLoading } = useQuery({
    queryKey: ["billing-status"],
    queryFn: async () => {
      const res = await api.get("/api/billing/status");
      return res.data.data;
    }
  });

  const plan = {
    name: "Pro",
    price: "R$ 297",
    period: "mês",
    status: statusData?.status || "inactive"
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      if (plan.status === "inactive" || plan.status === "canceled") {
        const res = await api.post("/api/billing/checkout", { planId: "price_pro_456" });
        window.location.href = res.data.url;
      } else {
        const res = await api.get("/api/billing/portal");
        window.location.href = res.data.url;
      }
    } catch (err) {
      alert("Erro ao conectar ao provedor de pagamentos. Configure as chaves do Stripe no .env do backend.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/settings")}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <CreditCard className="size-6 text-primary" /> Faturamento e Assinatura
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Current Plan Card */}
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">Plano {plan.name}</h2>
                  {plan.status === "active" ? (
                    <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Ativo
                    </span>
                  ) : plan.status === "past_due" ? (
                    <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <AlertCircle className="size-3" /> Pagamento Pendente
                    </span>
                  ) : (
                    <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      Inativo
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">
                  Você está no plano {plan.name}.
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold mb-1">
                  {plan.price}<span className="text-lg text-muted-foreground font-normal">/{plan.period}</span>
                </div>
                <button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {loading ? "Redirecionando..." : plan.status === "inactive" ? "Assinar Plano" : "Gerenciar Assinatura"}
                </button>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Zap className="size-5 text-amber-500" />
                  Mensagens de IA (WhatsApp)
                </h3>
                <span className="text-sm font-medium">{statusData?.metrics?.messages || 0} / 1000</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${Math.min(((statusData?.metrics?.messages || 0) / 1000) * 100, 100)}%` }}></div>
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.min(((statusData?.metrics?.messages || 0) / 1000) * 100, 100).toFixed(1)}% do seu limite mensal utilizado. O plano Pro inclui 1000 mensagens grátis.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="size-5 text-primary" />
                  Pacientes Ativos
                </h3>
                <span className="text-sm font-medium">{statusData?.metrics?.patients || 0} / Ilimitado</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <p className="text-xs text-muted-foreground">
                Seu plano não tem limite de pacientes ou agendamentos.
              </p>
            </div>
          </div>

          {/* Alert */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
            <AlertCircle className="size-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">Cobrança Automática</h4>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                Ao exceder o limite de mensagens de IA, as mensagens extras serão cobradas avulsamente (R$ 0,15 por mensagem) no próximo ciclo.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
