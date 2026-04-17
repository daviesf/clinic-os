import { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { logger } from "../../lib/logger";
import { incomingMessageQueue } from "../../application/queues/messageQueue";

export class WebhookController {
  constructor() {}

  async handle(req: Request, res: Response) {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;

    // 1. Respond immediately
    res.sendStatus(200);

    // 2. Process async
    if (value) {
      const requestId = randomUUID();
      const contextValue = { ...value, requestId };

      // Push directly to queue
      incomingMessageQueue.add("process-webhook", contextValue).catch((err) => {
        logger.error({ msg: "webhook_enqueue_error", error: err });
      });
    }
  }
}
