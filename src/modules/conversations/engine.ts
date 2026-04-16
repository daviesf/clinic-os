import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { WhatsAppService } from "../whatsapp/service";
import { PromptService } from "../ai/promptService";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(phone: string): boolean {
  const now = Date.now();
  const limitWindowMs = 10000;
  const maxMessages = 15;

  let record = rateLimitMap.get(phone);
  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + limitWindowMs };
    rateLimitMap.set(phone, record);
  }

  record.count++;
  return record.count <= maxMessages;
}

export class ConversationEngine {
  constructor(
    private whatsappService: WhatsAppService,
    private promptService: PromptService,
  ) {}

  async handleIncomingMessage(
    tenantId: string,
    phone: string,
    content: string,
    messageId: string,
  ) {
    const start = Date.now();

    try {
      if (!phone || !content) return;
      if (!checkRateLimit(phone)) return;

      // 1. Message received
      logger.info({
        event: "message.received",
        content,
      });

      let conversation = await prisma.conversation.findFirst({
        where: { tenantId, phone },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { tenantId, phone, status: "AUTO" },
        });
      }

      try {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            direction: "INBOUND",
            content,
            externalId: messageId || null,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          return;
        }
        throw error;
      }

      // 2. Message persisted
      logger.info({
        event: "message.persisted",
        conversationId: conversation.id,
      });

      const action = conversation.status as "AUTO" | "SUGGESTION" | "HUMAN";

      // 3. Decision
      logger.info({
        event: "message.action",
        action,
      });

      if (action === "HUMAN") {
        return { action };
      }

      // Classify intent
      const normalizedContent = content.toLowerCase();
      const intent = normalizedContent.includes("agendar")
        ? "schedule"
        : "unknown";
      const priority = "normal";

      // 4. Classification
      logger.info({
        event: "message.classified",
        intent,
        priority,
      });

      let responseText = "";
      if (intent === "schedule") {
        responseText =
          "Para agendar, por favor informe a data e hora desejada.";
      } else {
        responseText = "Olá! Sou o assistente virtual. Como posso ajudar?";
      }

      // 5. Response
      logger.info({
        event: "message.response",
        response: responseText,
      });

      const windowMinutes = Math.floor(Date.now() / 60000);
      const hashString = `${phone}-${responseText}-${windowMinutes}`;
      const outboundId = crypto
        .createHash("sha256")
        .update(hashString)
        .digest("hex");

      const exists = await prisma.message.findUnique({
        where: { outboundId },
      });

      if (!exists) {
        await this.whatsappService.sendMessage(phone, responseText);
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            direction: "OUTBOUND",
            content: responseText,
            outboundId,
          },
        });
      }

      return {
        response: responseText,
        action,
        intent,
      };
    } catch (error) {
      logger.error({
        event: "message.error",
        error,
      });
    } finally {
      const durationMs = Date.now() - start;
      // 6. Done
      logger.info({
        event: "message.done",
        durationMs,
      });
    }
  }
}
