import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import { ConversationController } from "../controllers/ConversationController";
import { MessageController } from "../controllers/MessageController";
import { buildConversationRoutes } from "./conversationRoutes";
import { buildMessageRoutes } from "./messageRoutes";

export function buildApiRoutes(
  conversationController: ConversationController,
  messageController: MessageController
): Router {
  const router = Router();

  // All API routes require JWT authentication
  router.use(jwtAuth);

  // Mount sub-routes
  router.use("/conversations", buildConversationRoutes(conversationController));
  router.use("/", buildMessageRoutes(messageController));

  return router;
}
