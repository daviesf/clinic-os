import { IConversationRepository } from "../../application/interfaces/repositories";
import { logger } from "../../lib/logger";

export class ConversationStateService {
  constructor(private conversationRepo: IConversationRepository) {}

  async transitionToHuman(conversationId: string): Promise<void> {
    logger.info({ event: "conversation.transition", status: "HUMAN", conversationId });
    await this.conversationRepo.updateStatus(conversationId, "HUMAN");
  }

  async transitionToAuto(conversationId: string): Promise<void> {
    logger.info({ event: "conversation.transition", status: "AUTO", conversationId });
    await this.conversationRepo.updateStatus(conversationId, "AUTO");
  }

  async applyAction(conversationId: string, targetStatus: string): Promise<boolean> {
    if (targetStatus === "HUMAN") {
      await this.transitionToHuman(conversationId);
      return true;
    } else if (targetStatus === "AUTO") {
      await this.transitionToAuto(conversationId);
      return true;
    }
    return false;
  }
}
