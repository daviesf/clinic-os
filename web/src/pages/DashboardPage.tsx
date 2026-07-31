import { api } from "../services/api";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { LayoutDashboard, Users, MessageSquare, Bot, UserPlus, CalendarCheck, CalendarX, Activity, DollarSign, TrendingUp } from "lucide-react";

export function DashboardPage() {
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["dashboard-analytics"],
    queryFn: async () => {
      const res = await api.get("/api/analytics/dashboard");
      return res.data.data;
    }
  });

  if (isLoading) {
    return <div className="p-8 animate-pulse text-gray-500">Carregando dashboard...</div>;
  }

  if (isError || !response) {
    return <div className="p-8 text-red-500">Erro ao carregar dados do dashboard.</div>;
  }

  const {
    totalConversations,
    aiResolutionRate,
    handoffRate,
    conversationsByStatus,
    totalPatients,
    newPatients,
    appointmentsScheduled,
    appointmentsCompleted,
    appointmentsCanceled
  } = response;

  const resolutionData = [
    { name: "Resolvido via IA", value: aiResolutionRate, color: "#10b981" },
    { name: "Human Handoff", value: handoffRate, color: "#f59e0b" }
  ];

  const statusData = conversationsByStatus.map((item: any) => ({
    name: item.status,
    conversas: item._count
  }));

  const totalAppointments = appointmentsScheduled + appointmentsCompleted + appointmentsCanceled;
  const cancelRate = totalAppointments > 0 ? (appointmentsCanceled / totalAppointments) * 100 : 0;
  
  // Financial estimation: configurable average ticket
  const ticketMedio = 350; // TODO: pull from tenant settings when implemented
  const receitaEstimadaMensal = (appointmentsCompleted + appointmentsScheduled) * ticketMedio;
  const receitaPerdida = appointmentsCanceled * ticketMedio;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center space-x-3">
        <LayoutDashboard className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex items-center space-x-4">
          <div className="p-4 bg-primary/10 rounded-xl">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pacientes Ativos</p>
            <p className="text-2xl font-bold">{totalPatients || 0}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex items-center space-x-4">
          <div className="p-4 bg-emerald-500/10 rounded-xl">
            <UserPlus className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Novos (30 dias)</p>
            <p className="text-2xl font-bold">{newPatients || 0}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex items-center space-x-4">
          <div className="p-4 bg-blue-500/10 rounded-xl">
            <CalendarCheck className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Consultas Agendadas</p>
            <p className="text-2xl font-bold">{appointmentsScheduled || 0}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex items-center space-x-4">
          <div className="p-4 bg-red-500/10 rounded-xl">
            <CalendarX className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Taxa Cancelamento</p>
            <p className="text-2xl font-bold">{cancelRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex items-center space-x-4">
          <div className="p-4 bg-indigo-500/10 rounded-xl">
            <MessageSquare className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total de Conversas</p>
            <p className="text-2xl font-bold">{totalConversations}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex items-center space-x-4">
          <div className="p-4 bg-emerald-500/10 rounded-xl">
            <Bot className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Resolução da IA</p>
            <p className="text-2xl font-bold">{aiResolutionRate.toFixed(1)}%</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex items-center space-x-4">
          <div className="p-4 bg-amber-500/10 rounded-xl">
            <Activity className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Taxa de Handoff</p>
            <p className="text-2xl font-bold">{handoffRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Financial Section */}
      <h2 className="text-xl font-semibold mt-4">Financeiro da Clínica</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 rounded-2xl shadow-sm border border-emerald-500/20 p-6 flex items-center space-x-4">
          <div className="p-4 bg-emerald-500/20 rounded-xl">
            <DollarSign className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-600">Receita Estimada (Mensal)</p>
            <p className="text-3xl font-bold text-emerald-700">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaEstimadaMensal)}
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-2xl shadow-sm border border-red-500/20 p-6 flex items-center space-x-4">
          <div className="p-4 bg-red-500/20 rounded-xl">
            <TrendingUp className="w-8 h-8 text-red-600 rotate-180" />
          </div>
          <div>
            <p className="text-sm font-medium text-red-600">Receita Perdida (Cancelamentos)</p>
            <p className="text-3xl font-bold text-red-700">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaPerdida)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold mb-6">Eficiência de Resolução</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resolutionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {resolutionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${Number(value).toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            {resolutionData.map(item => (
              <div key={item.name} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold mb-6">Conversas por Status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="conversas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
