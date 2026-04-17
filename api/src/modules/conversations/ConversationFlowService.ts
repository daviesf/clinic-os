import { ConversationStateService } from "../../domain/conversation/ConversationStateService";
import { AIClassification, ConversationStatus, MessagePriority } from "./types";

export class ConversationFlowService {
  constructor(private stateService: ConversationStateService) {}

  async decide(conversation: any, classification: AIClassification) {
    const currentStatus = conversation.status as ConversationStatus;

    if (currentStatus === ConversationStatus.HUMAN) {
      return { action: ConversationStatus.HUMAN };
    }

    if (classification.priority === MessagePriority.HIGH) {
      await this.stateService.applyAction(conversation.id, ConversationStatus.HUMAN);
      return { action: ConversationStatus.HUMAN };
    }

    const nextAction = classification.action || ConversationStatus.AUTO;

    if (nextAction !== currentStatus) {
      await this.stateService.applyAction(conversation.id, nextAction);
    }

    return { ...classification, action: nextAction };
  }
}
