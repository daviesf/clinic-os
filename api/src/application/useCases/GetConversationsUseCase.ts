import { IConversationRepository } from "../interfaces/repositories";
import { ConversationDTO } from "../dtos/ConversationDTO";
import { logger } from "../../lib/logger";

export class GetConversationsUseCase {
  constructor(private conversationRepo: IConversationRepository) {}

  async execute(tenantId: string): Promise<ConversationDTO[]> {
    logger.info({ event: "usecase.get_conversations", tenantId });

    const conversations = await this.conversationRepo.findAllByTenant(tenantId);

    return conversations.map((conv) => ({
      id: conv.id,
      phone: conv.phone,
      status: conv.status,
      lastMessage: conv.lastMessage,
      updatedAt: conv.updatedAt.toISOString(),
    }));
  }
}
