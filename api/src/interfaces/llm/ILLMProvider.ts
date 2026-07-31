/**
 * ILLMProvider — Abstraction layer for LLM integrations.
 * 
 * All AI logic in the domain layer must depend on this interface,
 * never on a specific SDK (OpenAI, Anthropic, etc.).
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>; // JSON Schema
}

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface LLMResponse {
  content: string | null;
  toolCalls: ToolCall[];
}

export interface ILLMProvider {
  /**
   * Send a chat completion request.
   * @param messages - The conversation history
   * @param tools - Optional tool/function definitions for function calling
   * @returns The LLM response with optional tool calls
   */
  chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<LLMResponse>;

  /**
   * Generate an embedding vector for a given text.
   * Used for semantic memory / RAG in later phases.
   * @param text - The text to embed
   * @returns A numeric vector
   */
  embed(text: string): Promise<number[]>;
}
