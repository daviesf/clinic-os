import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTenantSettings, updateTenantSettings } from "../services/tenantService";
import type { TenantSettings } from "../services/tenantService";
import { ArrowLeft, Save, Loader2, Settings, Bot, MessageCircle, MapPin } from "lucide-react";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // General state
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicTimezone, setClinicTimezone] = useState("America/Sao_Paulo");

  // AI state
  const [promptConfig, setPromptConfig] = useState("");
  const [aiModel, setAiModel] = useState("gpt-4o");
  const [aiTemperature, setAiTemperature] = useState(0.7);
  const [autoHandoff, setAutoHandoff] = useState(false);

  // WhatsApp state
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");
  const [webhookVerifyToken, setWebhookVerifyToken] = useState("");

  useEffect(() => {
    getTenantSettings()
      .then((data) => {
        setSettings(data);
        setName(data.name || "");
        setSpecialty(data.specialty || "");
        setClinicAddress(data.clinicAddress || "");
        setClinicTimezone(data.clinicTimezone || "America/Sao_Paulo");
        setPromptConfig(data.promptConfig || "");
        setAiModel(data.aiModel || "gpt-4o");
        setAiTemperature(data.aiTemperature ?? 0.7);
        setAutoHandoff(data.autoHandoff || false);
        setPhoneNumberId(data.phoneNumberId || "");
        setWhatsappToken(data.whatsappToken || "");
        setWebhookVerifyToken(data.webhookVerifyToken || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateTenantSettings({ 
        name, specialty, clinicAddress, clinicTimezone,
        promptConfig, aiModel, aiTemperature, autoHandoff,
        phoneNumberId, whatsappToken, webhookVerifyToken 
      });
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <Loader2 className="size-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const tabs = [
    { id: "general", label: "Geral", icon: <Settings className="size-4" /> },
    { id: "ai", label: "Inteligência Artificial", icon: <Bot className="size-4" /> },
    { id: "whatsapp", label: "Integração WhatsApp", icon: <MessageCircle className="size-4" /> },
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border bg-card shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Configurações da Clínica
            </h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate("/users")} className="px-4 py-2 bg-muted hover:bg-muted/80 text-sm font-medium rounded-lg transition-colors">
              Gerenciar Equipe
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 font-medium">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? "Salvando..." : "Salvar Tudo"}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto px-6 flex gap-6 border-t border-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {saved && (
            <div className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-4 py-3 rounded-xl flex items-center gap-2">
              <span className="font-semibold text-sm">Configurações salvas com sucesso!</span>
            </div>
          )}

          {/* General Settings */}
          {activeTab === "general" && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Nome da Clínica</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Especialidade</label>
                  <input type="text" value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="Ex: Odontologia" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">Endereço Completo</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <input type="text" value={clinicAddress} onChange={e => setClinicAddress(e.target.value)} placeholder="Av. Paulista, 1000 - Bela Vista" className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Fuso Horário (Timezone)</label>
                  <select value={clinicTimezone} onChange={e => setClinicTimezone(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/50">
                    <option value="America/Sao_Paulo">Brasília (America/Sao_Paulo)</option>
                    <option value="America/Manaus">Manaus (America/Manaus)</option>
                    <option value="Europe/Lisbon">Lisboa (Europe/Lisbon)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* AI Settings */}
          {activeTab === "ai" && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-2 gap-6 border-b border-border pb-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Modelo de IA (Motor)</label>
                  <select value={aiModel} onChange={e => setAiModel(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/50">
                    <option value="gpt-4o">GPT-4o (Recomendado)</option>
                    <option value="gpt-4o-mini">GPT-4o Mini (Mais rápido)</option>
                    <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Temperatura ({aiTemperature})</label>
                  <input type="range" min="0" max="1" step="0.1" value={aiTemperature} onChange={e => setAiTemperature(parseFloat(e.target.value))} className="w-full mt-2 accent-primary" />
                  <p className="text-xs text-muted-foreground mt-1">0.0 (Robótico/Exato) a 1.0 (Criativo/Flexível)</p>
                </div>
                <div className="col-span-2 flex items-center justify-between p-4 border border-border rounded-xl bg-background/50">
                  <div>
                    <h3 className="font-medium text-foreground">Handoff Automático (Transbordo)</h3>
                    <p className="text-sm text-muted-foreground">Transferir para humano automaticamente se a IA não souber responder algo crítico.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={autoHandoff} onChange={e => setAutoHandoff(e.target.checked)} />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Prompt Base da IA (Comportamento)</label>
                <p className="text-xs text-muted-foreground mb-3">
                  Instruções mestre sobre como a IA deve se comportar com seus pacientes.
                </p>
                <textarea
                  value={promptConfig}
                  onChange={(e) => setPromptConfig(e.target.value)}
                  rows={8}
                  placeholder="Ex: Você é a assistente virtual da Clínica Sorriso. Seja educada, objetiva e sempre ofereça opções de agendamento..."
                  className="w-full px-3 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/50 resize-y font-mono text-sm shadow-inner"
                />
              </div>
            </div>
          )}

          {/* WhatsApp Settings */}
          {activeTab === "whatsapp" && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-6">
                <h3 className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-2">
                  <MessageCircle className="size-5" /> Integração Oficial Meta Cloud API
                </h3>
                <p className="text-sm text-emerald-600/80 dark:text-emerald-500 mt-1">
                  Obtenha essas credenciais no painel de desenvolvedores do Facebook (Meta for Developers).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">WhatsApp Phone Number ID</label>
                  <input type="text" value={phoneNumberId} onChange={e => setPhoneNumberId(e.target.value)} placeholder="Ex: 123456789012345" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/50 font-mono text-sm" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">Access Token Permanente (WABA)</label>
                  <input type="password" value={whatsappToken} onChange={e => setWhatsappToken(e.target.value)} placeholder="EAA..." className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/50 font-mono text-sm" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">Webhook Verify Token</label>
                  <input type="text" value={webhookVerifyToken} onChange={e => setWebhookVerifyToken(e.target.value)} placeholder="Uma senha sua para validar o webhook" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/50 font-mono text-sm" />
                  <p className="text-xs text-muted-foreground mt-2">
                    URL do Webhook: <code className="bg-muted px-1 py-0.5 rounded text-primary">https://sua-api.clinicos.com/api/webhooks/whatsapp</code>
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
