import { IConversationRepository, IMessageRepository } from "../interfaces/repositories";
import { MessageDTO } from "../dtos/MessageDTO";
import { AppError } from "../../lib/errors";
import { logger } from "../../lib/logger";

export class GetMessagesUseCase {
  constructor(
    private conversationRepo: IConversationRepository,
    private messageRepo: IMessageRepository
  ) {}

  async execute(conversationId: string, tenantId: string): Promise<MessageDTO[]> {
    logger.info({ event: "usecase.get_messages", conversationId, tenantId });

    const conversation = await this.conversationRepo.findById(conversationId);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    if (conversation.tenantId !== tenantId) {
      logger.warn({
        event: "usecase.get_messages.forbidden",
        conversationId,
        requestedByTenant: tenantId,
        ownerTenant: conversation.tenantId,
      });
      throw new AppError("Forbidden", 403);
    }

    const messages = await this.messageRepo.findByConversation(conversationId);

    return messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      direction: msg.direction,
      status: msg.status,
      createdAt: msg.createdAt.toISOString(),
    }));
  }
}
