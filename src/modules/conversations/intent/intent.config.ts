import { MessageIntent, MessagePriority, ConversationStatus } from "../types";

export interface IntentRule {
  intent: MessageIntent;
  priority: MessagePriority;
  action: ConversationStatus;
  weight: number;
  patterns: string[];
}

// This file is the source of truth for intent classification.
// No logic should be placed outside this file.

export const INTENT_RULES: IntentRule[] = [
  {
    intent: MessageIntent.SCHEDULE,
    priority: MessagePriority.NORMAL,
    action: ConversationStatus.AUTO,
    weight: 10,
    patterns: [
      "agendar",
      "consulta",
      "marcar",
      "horario",
      "disponivel",
      "vago",
      "vagas",
      "agenda",
      "abrir vaga",
    ],
  },
  {
    intent: MessageIntent.UNKNOWN,
    priority: MessagePriority.HIGH,
    action: ConversationStatus.HUMAN,
    weight: 100,
    patterns: [
      "dor no peito",
      "urgente",
      "emergencia",
      "socorro",
      "ajuda",
      "ajuda medica",
    ],
  },
];


