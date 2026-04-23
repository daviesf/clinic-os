export interface ConversationDTO {
  id: string;
  phone: string;
  status: string;
  lastMessage: string | null;
  updatedAt: string;
}

export interface MessageDTO {
  id: string;
  content: string;
  direction: "INBOUND" | "OUTBOUND";
  status: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
}
