import { useQuery } from "@tanstack/react-query";
import { getMessages } from "@/services/conversationService";

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => getMessages(conversationId!),
    enabled: !!conversationId,
    refetchInterval: 5_000,
  });
}
