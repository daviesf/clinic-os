import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./useSocket";

export function useSocketSync() {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (message: any) => {
      // Invalidate the specific conversation messages
      queryClient.invalidateQueries({ queryKey: ["messages", message.conversationId] });
      // Invalidate the conversation list to update last message/timestamp
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    const onConversationUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    socket.on("new_message", onNewMessage);
    socket.on("conversation_updated", onConversationUpdated);

    return () => {
      socket.off("new_message", onNewMessage);
      socket.off("conversation_updated", onConversationUpdated);
    };
  }, [socket, queryClient]);

  return isConnected;
}
