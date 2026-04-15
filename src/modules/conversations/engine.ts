import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { WhatsAppService } from "../whatsapp/service";

// Simple in-memory rate limiter per phone: max 5 messages per 10s
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(phone: string): boolean {
  const now = Date.now();
  const limitWindowMs = 10000;
  const maxMessages = 5;

  let record = rateLimitMap.get(phone);
  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + limitWindowMs };
    rateLimitMap.set(phone, record);
  }

  record.count++;
  return record.count <= maxMessages;
}

export class ConversationEngine {
  constructor(private whatsappService: WhatsAppService) {}

  async handleIncomingMessage(
    tenantId: string,
    phone: string,
    content: string,
    messageId: string,
  ) {
    const start = Date.now();

    try {
      // Input validation
      if (!phone || !content) {
        logger.warn({
          msg: "invalid_input_data",
          phone: phone || null,
          content: content || null,
        });
        return;
      }

      // Rate limit check
      if (!checkRateLimit(phone)) {
        logger.warn({
          msg: "rate_limit_exceeded",
          phone,
        });
        return;
      }

      // 1. Idempotency check — reject duplicate messages
      if (messageId) {
        const exists = await prisma.message.findUnique({
          where: { externalId: messageId },
        });

        if (exists) {
          logger.warn({
            msg: "duplicate_message",
            messageId,
          });
          return;
        }
      }

      // 2. Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          tenantId,
          phone,
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            tenantId,
            phone,
            status: "AUTO",
          },
        });

        logger.info({
          msg: "conversation_created",
          conversationId: conversation.id,
        });
      }

      // 3. CRITICAL: Persist message FIRST
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: "INBOUND",
          content: content,
          externalId: messageId || null,
        },
      });

      logger.info({
        msg: "message_persisted",
        conversationId: conversation.id,
      });

      // 4. If status === "HUMAN" -> return
      if (conversation.status === "HUMAN") {
        logger.info({
          msg: "human_mode_skip",
          conversationId: conversation.id,
        });
        return;
      }

      // 5. Logic & Response (Protected)
      try {
        // Classify intent (mock)
        const normalizedContent = content.toLowerCase();
        const intent = normalizedContent.includes("agendar")
          ? "schedule"
          : "unknown";

        // Helper to send and persist outbound message idempotently
        const sendOutbound = async (replyContent: string) => {
          // Idempotency: deterministic ID using phone + content + 1 minute window
          const windowMinutes = Math.floor(Date.now() / 60000);
          const hashString = `${phone}-${replyContent}-${windowMinutes}`;
          const outboundId = crypto
            .createHash("sha256")
            .update(hashString)
            .digest("hex");

          const exists = await prisma.message.findUnique({
            where: { outboundId },
          });

          if (exists) {
            logger.warn({
              msg: "duplicate_outbound_prevented",
              phone,
              outboundId,
            });
            return;
          }

          // Send message
          await this.whatsappService.sendMessage(phone, replyContent);

          // Persist outbound status
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              direction: "OUTBOUND",
              content: replyContent,
              outboundId,
            },
          });
        };

        // Handle intent
        if (intent === "schedule") {
          await sendOutbound(
            "Para agendar, por favor informe a data e hora desejada.",
          );
        } else {
          await sendOutbound(
            "Olá! Sou o assistente virtual. Como posso ajudar?",
          );
        }
      } catch (logicError) {
        logger.error({
          msg: "logic_error",
          error: logicError,
          conversationId: conversation.id,
        });
        // Message is already saved, so we don't lose data even if logic fails.
      }
    } catch (error) {
      logger.error({
        msg: "critical_engine_error",
        error,
      });
    } finally {
      const durationMs = Date.now() - start;
      logger.info({
        msg: "message_processed",
        durationMs,
      });
    }
  }
}
