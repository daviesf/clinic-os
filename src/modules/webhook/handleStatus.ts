import { logger } from "../../lib/logger";

export async function handleStatus(status: any, requestId: string) {
  if (status.status === "failed") {
    logger.error({ 
      msg: "whatsapp_failed", 
      requestId,
      status: status.status,
      messageId: status.id,
      recipient: status.recipient_id,
      errors: status.errors ?? null
    });
  } else {
    logger.info({ 
      msg: "whatsapp_status", 
      requestId,
      status: status.status,
      messageId: status.id,
      recipient: status.recipient_id 
    });
  }
}
