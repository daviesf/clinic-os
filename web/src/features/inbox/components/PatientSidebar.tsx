import { useQuery } from "@tanstack/react-query";
import { useConversations } from "@/features/inbox/hooks/useConversations";
import { useInboxStore } from "@/features/inbox/store/inboxStore";
import { patientService } from "@/features/patients/api/patientService";
import { User, Phone, Calendar, Clock, FileText, BrainCircuit, Activity } from "lucide-react";

export function PatientSidebar() {
  const conversationId = useInboxStore((s) => s.selectedConversationId);
  const { data: conversations } = useConversations();

  const currentConversation = conversations?.find((c) => c.id === conversationId);
  const patientId = currentConversation?.patient?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["patient360", patientId],
    queryFn: () => patientService.getPatient360(patientId!),
    enabled: !!patientId,
  });

  if (!currentConversation) return null;

  const patient = (data?.data || currentConversation.patient) as any;

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full overflow-y-auto shrink-0 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="p-6 border-b border-border text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="size-10 text-primary" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">
          {patient?.name || "Paciente Desconhecido"}
        </h2>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
          <Phone className="size-3.5" />
          <span>{currentConversation.phone}</span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <h3 className="text-sm font-semibold tracking-tight mb-3 flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            Informações
          </h3>
          <div className="bg-muted/50 rounded-lg p-3 space-y-3">
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Status de Consentimento LGPD</span>
              <span className="text-sm font-medium">
                {patient?.lgpdConsent ? "Consentido" : "Pendente"}
              </span>
            </div>
            {patient?.email && (
              <div>
                <span className="text-xs text-muted-foreground block mb-1">E-mail</span>
                <span className="text-sm font-medium">{patient.email}</span>
              </div>
            )}
            {patient?.notes && (
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Observações</span>
                <span className="text-sm font-medium">{patient.notes}</span>
              </div>
            )}
          </div>
        </div>

        {patient?.appointments && (
          <div>
            <h3 className="text-sm font-semibold tracking-tight mb-3 flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              Agendamentos
            </h3>
            <div className="space-y-2">
              {patient.appointments.length === 0 ? (
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <Clock className="size-6 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Nenhum agendamento encontrado.</p>
                </div>
              ) : (
                patient.appointments.slice(0, 3).map((apt: any) => (
                  <div key={apt.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="font-medium">{new Date(apt.date).toLocaleDateString("pt-BR")}</p>
                    <p className="text-muted-foreground text-xs">{apt.status}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {patient?.semanticMemories && patient.semanticMemories.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold tracking-tight mb-3 flex items-center gap-2">
              <BrainCircuit className="size-4 text-primary" />
              Memória Semântica
            </h3>
            <div className="space-y-2">
              {patient.semanticMemories.slice(0, 4).map((mem: any) => (
                <div key={mem.id} className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-xs leading-relaxed">
                  <span className="block text-primary/80 font-medium mb-1">Fato Registrado</span>
                  <p>{mem.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {patient?.episodicMemories && patient.episodicMemories.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold tracking-tight mb-3 flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Resumos de Atendimento
            </h3>
            <div className="space-y-2">
              {patient.episodicMemories.slice(0, 3).map((mem: any) => (
                <div key={mem.id} className="bg-muted rounded-lg p-3 text-xs leading-relaxed border border-border">
                  <p className="text-[10px] text-muted-foreground mb-1">{new Date(mem.createdAt).toLocaleDateString("pt-BR")}</p>
                  <p>{mem.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
