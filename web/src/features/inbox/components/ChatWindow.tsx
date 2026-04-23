import { useEffect, useRef } from "react";
import { useMessages } from "@/features/inbox/hooks/useMessages";
import { useInboxStore } from "@/features/inbox/store/inboxStore";
import { MessageInput } from "./MessageInput";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, MessagesSquare } from "lucide-react";

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function ChatWindow() {
  const conversationId = useInboxStore((s) => s.selectedConversationId);
  const { data: messages, isLoading, error } = useMessages(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!conversationId) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="h-14 flex items-center px-4 border-b border-border shrink-0 bg-card">
        <span className="text-sm font-medium">Conversa</span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-muted/30">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="size-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive font-medium">Erro ao carregar mensagens</p>
            </div>
          </div>
        )}

        {!isLoading && !error && messages && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessagesSquare className="size-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma mensagem nesta conversa</p>
            </div>
          </div>
        )}

        {messages && messages.length > 0 && (
          <div className="space-y-2 max-w-2xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                id={`message-${message.id}`}
                className={cn(
                  "flex",
                  message.direction === "OUTBOUND" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2 max-w-[70%] text-sm leading-relaxed shadow-sm",
                    message.direction === "OUTBOUND"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border rounded-bl-md"
                  )}
                >
                  <p>{message.content}</p>
                  <div
                    className={cn(
                      "text-[10px] mt-1 flex items-center gap-1",
                      message.direction === "OUTBOUND"
                        ? "text-primary-foreground/60 justify-end"
                        : "text-muted-foreground justify-start"
                    )}
                  >
                    <span>{formatMessageTime(message.createdAt)}</span>
                    {message.direction === "OUTBOUND" && (
                      <span className="text-[9px]">
                        {message.status === "SENT" || message.status === "DELIVERED"
                          ? "✓✓"
                          : message.status === "PENDING"
                            ? "⏳"
                            : message.status === "FAILED"
                              ? "✕"
                              : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="px-4 py-3 border-t border-border bg-card shrink-0">
        <MessageInput />
      </div>
    </div>
  );
}
