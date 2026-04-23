import { useState } from "react";
import { useSendMessage } from "@/features/inbox/hooks/useSendMessage";
import { useInboxStore } from "@/features/inbox/store/inboxStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

export function MessageInput() {
  const [text, setText] = useState("");
  const conversationId = useInboxStore((s) => s.selectedConversationId);
  const { mutate: send, isPending } = useSendMessage(conversationId);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    send(trimmed, {
      onSuccess: () => setText(""),
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const canSend = text.trim().length > 0 && !isPending;

  return (
    <div className="flex items-center gap-2">
      <Input
        id="message-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Digite uma mensagem..."
        disabled={isPending}
        className="flex-1"
      />
      <Button
        id="send-button"
        onClick={handleSend}
        disabled={!canSend}
        size="icon"
        className="shrink-0"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
      </Button>
    </div>
  );
}
