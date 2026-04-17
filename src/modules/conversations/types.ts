export enum ConversationStatus {
  AUTO = "AUTO",
  SUGGESTION = "SUGGESTION",
  HUMAN = "HUMAN",
}

export enum MessageIntent {
  SCHEDULE = "SCHEDULE",
  UNKNOWN = "UNKNOWN",
}

export enum MessagePriority {
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  LOW = "LOW",
}

export enum MessageDirection {
  INBOUND = "INBOUND",
  OUTBOUND = "OUTBOUND",
}

export interface EvaluatedRule {
  intent: MessageIntent;
  matches: number;
  score: number;
  matchedPatterns: string[];
}

export interface AIClassification {
  intent: MessageIntent;
  priority: MessagePriority;
  action: ConversationStatus;
  score?: number;
  matchedPatterns?: string[];
  skippedRulesCount?: number;
  evaluatedRules?: EvaluatedRule[];
}


