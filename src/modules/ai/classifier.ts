import { MessageIntent, MessagePriority } from "../conversations/types";

interface ClassificationResult {
  intent: string;
  risk_level: string;
}

export function classifyMessage(message: string): ClassificationResult {
  return {
    intent: MessageIntent.UNKNOWN,
    risk_level: MessagePriority.LOW,
  };
}
