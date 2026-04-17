import { IConversationRepository } from "../../application/interfaces/repositories";
import { ConversationStatus } from "./types";

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
}
