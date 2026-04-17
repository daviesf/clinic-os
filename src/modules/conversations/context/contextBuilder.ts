import { MessageDirection } from "../types";

export interface ContextMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationContext {
  messages: ContextMessage[];
  lastUserMessage?: string;
  lastAssistantMessage?: string;
}

export class ContextBuilder {
  private readonly MAX_MESSAGES = 12;

  build(
    messages: {
      content: string;
      direction: MessageDirection;
    }[],
  ): ConversationContext {
    if (!messages || messages.length === 0) {
      return { messages: [] };
    }

    // garante ordem cronológica
    const ordered = [...messages]
      .sort((a, b) => (a as any).createdAt - (b as any).createdAt)
      .slice(-this.MAX_MESSAGES);

    const contextMessages: ContextMessage[] = ordered.map((msg) => ({
      role: msg.direction === MessageDirection.INBOUND ? "user" : "assistant",
      content: msg.content,
    }));

    const lastUser = [...contextMessages]
      .reverse()
      .find((m) => m.role === "user");

    const lastAssistant = [...contextMessages]
      .reverse()
      .find((m) => m.role === "assistant");

    return {
      messages: contextMessages,
      lastUserMessage: lastUser?.content,
      lastAssistantMessage: lastAssistant?.content,
    };
  }
}
