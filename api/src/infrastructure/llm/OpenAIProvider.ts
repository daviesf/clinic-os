import { ILLMProvider, ChatMessage, ToolDefinition, LLMResponse, ToolCall } from "../../interfaces/llm/ILLMProvider";
import { logger } from "../../lib/logger";

export class OpenAIProvider implements ILLMProvider {
  private apiKey: string;
  private model: string;
  private embeddingModel: string;
  private baseUrl: string;

  constructor(config?: { apiKey?: string; model?: string; embeddingModel?: string; baseUrl?: string }) {
    this.apiKey = config?.apiKey || process.env.OPENAI_API_KEY || "";
    this.model = config?.model || "gpt-4o-mini";
    this.embeddingModel = config?.embeddingModel || "text-embedding-3-small";
    this.baseUrl = config?.baseUrl || "https://api.openai.com/v1";
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<LLMResponse> {
    const body: any = {
      model: this.model,
      messages,
    };

    if (tools && tools.length > 0) {
      body.tools = tools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error({ event: "openai.chat_error", status: response.status, error: errorData });
      
      if (response.status === 429) {
        throw new Error("RATE_LIMIT: Too Many Requests");
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    const toolCalls: ToolCall[] = (choice?.message?.tool_calls || []).map((tc: any) => ({
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments || "{}"),
    }));

    return {
      content: choice?.message?.content || null,
      toolCalls,
    };
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.embeddingModel,
        input: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error({ event: "openai.embed_error", status: response.status, error: errorData });
      
      if (response.status === 429) {
        throw new Error("RATE_LIMIT: Too Many Requests");
      }
      
      throw new Error(`OpenAI Embedding API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || [];
  }
}
