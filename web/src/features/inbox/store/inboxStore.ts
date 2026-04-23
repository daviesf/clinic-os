import { create } from "zustand";

interface InboxState {
  selectedConversationId: string | null;
  setSelectedConversation: (id: string | null) => void;
}

export const useInboxStore = create<InboxState>((set) => ({
  selectedConversationId: null,
  setSelectedConversation: (id) => set({ selectedConversationId: id }),
}));
