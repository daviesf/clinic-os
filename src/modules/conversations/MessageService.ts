import { IMessageRepository } from "../../application/interfaces/repositories";
import { MessageDirection } from "./types";
import { outboundMessageQueue } from "../../application/queues/messageQueue";

export class MessageService {
  constructor(private messageRepo: IMessageRepository) {}

  async saveInbound(conversationId: string, content: string, externalId: string): Promise<boolean> {
    try {
      await this.messageRepo.create({
        conversationId,
        direction: MessageDirection.INBOUND,
        content,
        externalId: externalId || null,
      });
      return true;
    } catch (error: any) {
      if (error.code === "P2002") {
        return false; // Duplicate
      }
      throw error;
    }
  }

  async saveOutbound(conversationId: string, content: string, outboundId: string, phone: string): Promise<void> {
    const exists = await this.messageRepo.findByOutboundId(outboundId);

    if (!exists) {
      const msg = await this.messageRepo.create({
        conversationId,
        direction: MessageDirection.OUTBOUND,
        content,
        outboundId,
        status: "PENDING"
      });

      // Point 10: Enqueue after saving
      await outboundMessageQueue.add("send-message", {
        messageId: msg.id,
        phone,
        content
      });
    }
  }
}
