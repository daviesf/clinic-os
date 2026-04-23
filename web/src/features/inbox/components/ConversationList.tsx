import { useConversations } from "@/features/inbox/hooks/useConversations";
import { useInboxStore } from "@/features/inbox/store/inboxStore";
import { cn } from "@/lib/utils";
import { Loader2, MessageSquareOff, AlertCircle } from "lucide-react";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return "agora";
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatPhone(phone: string): string {
  // Format Brazilian phone: 55 11 99999-9999
  if (phone.length === 13 && phone.startsWith("55")) {
    const ddd = phone.slice(2, 4);
    const part1 = phone.slice(4, 9);
    const part2 = phone.slice(9, 13);
    return `(${ddd}) ${part1}-${part2}`;
  }
  return phone;
}

export function ConversationList() {
  const { data: conversations, isLoading, error } = useConversations();
  const selectedId = useInboxStore((s) => s.selectedConversationId);
  const setSelected = useInboxStore((s) => s.setSelectedConversation);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="size-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive font-medium">Erro ao carregar conversas</p>
          <p className="text-xs text-muted-foreground mt-1">Verifique sua conexão</p>
        </div>
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <MessageSquareOff className="size-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          id={`conversation-${conversation.id}`}
          onClick={() => setSelected(conversation.id)}
          className={cn(
            "w-full text-left px-4 py-3 border-b border-border transition-colors",
            "hover:bg-accent/50 focus:outline-none focus-visible:bg-accent/50",
            selectedId === conversation.id && "bg-accent"
          )}
        >
          <div className="flex items-baseline justify-between gap-2 mb-0.5">
            <span className="text-sm font-medium truncate">
              {formatPhone(conversation.phone)}
            </span>
            <span className="text-[11px] text-muted-foreground shrink-0">
              {formatRelativeTime(conversation.updatedAt)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {conversation.lastMessage || "Sem mensagens"}
          </p>
        </button>
      ))}
    </div>
  );
}
