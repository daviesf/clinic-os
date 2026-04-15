import { logger } from "../../../lib/logger";
import { conversationEngine } from "../../../container";
import { asyncLocalStorage, RequestContext } from "../../../lib/requestContext";
import { prisma } from "../../../lib/prisma";

export async function handleIncomingMessage(value: any) {
  if (!value?.messages || value.messages.length === 0) return;

  const message = value.messages[0];
  const requestId = value.requestId;

  if (!message?.text?.body || !message?.from) {
    logger.warn({
      event: "message.invalid_payload",
      requestId,
      payload: {
        hasText: !!message.text?.body,
        from: message.from,
      },
    });
    return;
  }

  const messageId: string = message.id;
  const phone: string = message.from;
  const text: string = message.text.body;
  const tenantId = "default";

  // Idempotency Check
  const existingMessage = await prisma.message.findUnique({
    where: { externalId: messageId },
  });

  if (existingMessage) {
    logger.debug({
      event: "message.duplicate",
      messageId,
      phone,
    });
    return;
  }

  const context: RequestContext = {
    requestId,
    messageId,
    phone,
    tenantId,
  };

  await asyncLocalStorage.run(context, async () => {
    try {
      logger.info({
        event: "message.received",
        content: text,
      });

      await conversationEngine.handleIncomingMessage(
        tenantId,
        phone,
        text,
        messageId,
      );

      logger.info({
        event: "message.processed",
        phone,
        success: true,
      });
    } catch (error) {
      logger.error({
        event: "webhook.error",
        error,
      });
    }
  });
}
