import { IConversationRepository } from "../../application/interfaces/repositories";
import { ConversationStatus } from "./types";
import { emitToTenant } from "../../infrastructure/socket/emitter";
import { AuditService } from "../../application/services/AuditService";

export class ConversationService {
  constructor(private conversationRepo: IConversationRepository) {}

  async getOrCreate(tenantId: string, phone: string) {
    let conversation = await this.conversationRepo.findByPhone(tenantId, phone);

    if (!conversation) {
      conversation = await this.conversationRepo.create({
        tenantId,
        phone,
        status: ConversationStatus.AUTO
      });
    }

    return conversation;
  }

  async takeOver(conversationId: string, tenantId: string, userId?: string) {
    const conversation = await this.conversationRepo.updateStatus(conversationId, ConversationStatus.HUMAN);
    emitToTenant(tenantId, "conversation_updated", conversation);
    await AuditService.log(tenantId, "HANDOFF_HUMAN", "Conversation", userId, { conversationId });
    return conversation;
  }

  async releaseToAI(conversationId: string, tenantId: string, userId?: string) {
    const conversation = await this.conversationRepo.updateStatus(conversationId, ConversationStatus.AUTO);
    emitToTenant(tenantId, "conversation_updated", conversation);
    await AuditService.log(tenantId, "HANDOFF_AI", "Conversation", userId, { conversationId });
    return conversation;
  }
}
