import { useNavigate, useLocation } from "react-router-dom";
import { MessageSquare, Users, Calendar, LayoutDashboard, BookOpen, CreditCard, Settings, Zap, Stethoscope, CheckSquare, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

export function SidebarNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const routes = [
    { path: "/inbox", icon: MessageSquare, label: "Inbox" },
    { path: "/tasks", icon: CheckSquare, label: "Operações (Tasks)" },
    { path: "/consultation", icon: Stethoscope, label: "Copiloto Clínico" },
    { path: "/patients", icon: Users, label: "CRM Pacientes" },
    { path: "/agenda", icon: Calendar, label: "Agenda" },
    { path: "/crm", icon: PieChart, label: "CRM Comercial" },
    { path: "/automations", icon: Zap, label: "Automações" },
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/knowledge", icon: BookOpen, label: "Base de Conhecimento" },
  ];

  return (
    <div className="w-16 border-r border-border flex flex-col items-center py-4 bg-card shrink-0 gap-4">
      {routes.map((route) => (
        <button
          key={route.path}
          onClick={() => navigate(route.path)}
          className={cn(
            "p-3 rounded-xl transition-all",
            location.pathname.startsWith(route.path)
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={route.label}
        >
          <route.icon className="size-5" />
        </button>
      ))}

      <div className="mt-auto flex flex-col gap-4">
        <button
          onClick={() => navigate("/billing")}
          className={cn(
            "p-3 rounded-xl transition-all",
            location.pathname.startsWith("/billing")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title="Faturamento"
        >
          <CreditCard className="size-5" />
        </button>
        <button
          onClick={() => navigate("/settings")}
          className={cn(
            "p-3 rounded-xl transition-all",
            location.pathname.startsWith("/settings")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title="Configurações"
        >
          <Settings className="size-5" />
        </button>
      </div>
    </div>
  );
}
