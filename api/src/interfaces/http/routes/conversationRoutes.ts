import { Router } from "express";
import { ConversationController } from "../controllers/ConversationController";

export function buildConversationRoutes(controller: ConversationController): Router {
  const router = Router();

  router.get("/", (req, res) => controller.list(req, res));

  return router;
}
