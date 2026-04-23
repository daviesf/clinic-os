import { logger } from "../../../lib/logger";

export async function handleStatus(value: any) {
  if (!value?.statuses || value.statuses.length === 0) return;

  const status = value.statuses[0];
  const requestId = value.requestId; // Expected to be injected by webhookHandler

  if (status.status === "failed") {
    logger.error({
      event: "whatsapp.failed",
      requestId,
      status: status.status,
      messageId: status.id,
      recipient: status.recipient_id,
      errors: status.errors ?? null,
    });
  } else {
    logger.info({
      event: "whatsapp.status",
      requestId,
      status: status.status,
      messageId: status.id,
      recipient: status.recipient_id,
    });
  }
}
