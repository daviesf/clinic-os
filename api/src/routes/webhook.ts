import { Router, RequestHandler } from "express";
import { WebhookController } from "../modules/webhook/WebhookController";
import { env } from "../config/env";

export function buildWebhookRoutes(
  controller: WebhookController,
  signatureValidator?: RequestHandler
): Router {
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

  const postMiddleware: RequestHandler[] = signatureValidator ? [signatureValidator] : [];
  router.post("/webhook", ...postMiddleware, (req, res) => controller.handle(req, res));

  return router;
}
