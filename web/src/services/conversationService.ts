import { api } from "./api";
import type { ApiResponse, ConversationDTO, MessageDTO } from "@/types/api";

export async function getConversations(): Promise<ConversationDTO[]> {
  const response = await api.get<ApiResponse<ConversationDTO[]>>("/api/conversations");
  return response.data.data;
}

export async function getMessages(conversationId: string): Promise<MessageDTO[]> {
  const response = await api.get<ApiResponse<MessageDTO[]>>(
    `/api/conversations/${conversationId}/messages`
  );
  return response.data.data;
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<MessageDTO> {
  const response = await api.post<ApiResponse<MessageDTO>>(
    `/api/conversations/${conversationId}/messages`,
    { content }
  );
  return response.data.data;
}
