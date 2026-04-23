import { ConversationList } from "@/features/inbox/components/ConversationList";
import { ChatWindow } from "@/features/inbox/components/ChatWindow";
import { useInboxStore } from "@/features/inbox/store/inboxStore";
import { MessageSquare } from "lucide-react";

export default function InboxPage() {
  const selectedConversationId = useInboxStore((s) => s.selectedConversationId);

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col bg-card">
        <div className="h-14 flex items-center gap-2 px-4 border-b border-border shrink-0">
          <MessageSquare className="size-5 text-primary" />
          <h1 className="text-base font-semibold tracking-tight">ClinicOS Inbox</h1>
        </div>
        <ConversationList />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <ChatWindow />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Selecione uma conversa para começar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
