import { Router } from "express";
import { ConversationController } from "../controllers/ConversationController";

export function buildConversationRoutes(controller: ConversationController): Router {
  const router = Router();

  router.get("/", (req, res) => controller.list(req, res));
  router.post("/:conversationId/take-over", (req, res) => controller.takeOver(req, res));
  router.post("/:conversationId/release", (req, res) => controller.release(req, res));

  return router;
}
