import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "@/services/conversationService";
import type { MessageDTO } from "@/types/api";

export function useSendMessage(conversationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => {
      if (!conversationId) {
        return Promise.reject(new Error("No conversation selected"));
      }
      return sendMessage(conversationId, content);
    },
    onSuccess: (newMessage: MessageDTO) => {
      // Append message to cache immediately
      queryClient.setQueryData<MessageDTO[]>(
        ["messages", conversationId],
        (old) => (old ? [...old, newMessage] : [newMessage])
      );
      // Refetch conversations to update lastMessage
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
