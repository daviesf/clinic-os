import { Router } from "express";
import { MessageController } from "../controllers/MessageController";

export function buildMessageRoutes(controller: MessageController): Router {
  const router = Router();

  router.get("/conversations/:conversationId/messages", (req, res) => controller.list(req, res));
  router.post("/conversations/:conversationId/messages", (req, res) => controller.send(req, res));

  return router;
}
