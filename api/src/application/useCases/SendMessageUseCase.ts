import crypto from "crypto";
import { IConversationRepository, IMessageRepository } from "../interfaces/repositories";
import { MessageDTO } from "../dtos/MessageDTO";
import { MessageDirection, MessageStatus } from "../../modules/conversations/types";
import { outboundMessageQueue } from "../queues/messageQueue";
import { AppError } from "../../lib/errors";
import { logger } from "../../lib/logger";

export class SendMessageUseCase {
  constructor(
    private conversationRepo: IConversationRepository,
    private messageRepo: IMessageRepository
  ) {}

  async execute(conversationId: string, content: string, tenantId: string): Promise<MessageDTO> {
    if (!content || content.trim().length === 0) {
      throw new AppError("Message content cannot be empty", 400);
    }

    const conversation = await this.conversationRepo.findById(conversationId);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    if (conversation.tenantId !== tenantId) {
      logger.warn({
        event: "usecase.send_message.forbidden",
        conversationId,
        requestedByTenant: tenantId,
        ownerTenant: conversation.tenantId,
      });
      throw new AppError("Forbidden", 403);
    }

    const trimmedContent = content.trim();

    // Generate deterministic outboundId for idempotency
    const windowMinutes = Math.floor(Date.now() / 60000);
    const hashString = `${conversation.phone}-${trimmedContent}-${windowMinutes}`;
    const outboundId = crypto
      .createHash("sha256")
      .update(hashString)
      .digest("hex");

    // Check for duplicate within the same time window
    const existing = await this.messageRepo.findByOutboundId(outboundId);
    if (existing) {
      logger.info({ event: "usecase.send_message.duplicate", conversationId, outboundId });
      return {
        id: existing.id,
        content: existing.content,
        direction: existing.direction,
        status: existing.status,
        createdAt: existing.createdAt.toISOString(),
      };
    }

    const message = await this.messageRepo.create({
      conversationId,
      direction: MessageDirection.OUTBOUND,
      content: trimmedContent,
      outboundId,
      status: MessageStatus.PENDING,
    });

    // Enqueue for async delivery — no direct WhatsApp call
    await outboundMessageQueue.add("send-message", {
      messageId: message.id,
      phone: conversation.phone,
      content: trimmedContent,
    });

    logger.info({
      event: "usecase.send_message.enqueued",
      conversationId,
      messageId: message.id,
      outboundId,
      tenantId,
    });

    return {
      id: message.id,
      content: message.content,
      direction: message.direction,
      status: message.status,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
