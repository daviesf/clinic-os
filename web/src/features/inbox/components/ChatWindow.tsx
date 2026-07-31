import { useEffect, useRef } from "react";
import { useMessages } from "@/features/inbox/hooks/useMessages";
import { useConversations } from "@/features/inbox/hooks/useConversations";
import { useInboxStore } from "@/features/inbox/store/inboxStore";
import { takeOverConversation, releaseConversation } from "@/services/conversationService";
import { MessageInput } from "./MessageInput";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, MessagesSquare, UserRound, Bot } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function ChatWindow() {
  const conversationId = useInboxStore((s) => s.selectedConversationId);
  const { data: messages, isLoading, error } = useMessages(conversationId);
  const { data: conversations } = useConversations();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const currentConversation = conversations?.find((c) => c.id === conversationId);
  const isHuman = currentConversation?.status === "HUMAN";

  const handleToggleHandoff = async () => {
    if (!conversationId) return;
    if (isHuman) {
      await releaseConversation(conversationId);
    } else {
      await takeOverConversation(conversationId);
    }
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

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
      <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0 bg-card">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Conversa</span>
          {isHuman && (
            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full font-medium">
              Modo Humano
            </span>
          )}
        </div>
        <button
          onClick={handleToggleHandoff}
          className={cn(
            "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium",
            isHuman
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
              : "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
          )}
        >
          {isHuman ? <Bot className="size-3.5" /> : <UserRound className="size-3.5" />}
          {isHuman ? "Devolver à IA" : "Assumir"}
        </button>
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
