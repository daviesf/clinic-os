import { Router } from "express";
import { webhookHandler } from "../modules/webhook/webhookHandler";
import { logger } from "../lib/logger";
import { env } from "../config/env";

const router = Router();

router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

router.post("/webhook", (req, res) => {
  const value = req.body?.entry?.[0]?.changes?.[0]?.value;

  // 1. Respond immediately
  res.sendStatus(200);

  // 2. Process async (fire-and-forget)
  if (value) {
    webhookHandler(value).catch((err) => {
      logger.error({ msg: "webhook_async_error", error: err });
    });
  }
});

export default router;
