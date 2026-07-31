import { Request, Response } from "express";
import { GetConversationsUseCase } from "../../../application/useCases/GetConversationsUseCase";
import { ConversationService } from "../../../modules/conversations/ConversationService";
import { AuthContext } from "../types";
import { AppError } from "../../../lib/errors";
import { logger } from "../../../lib/logger";

export class ConversationController {
  constructor(
    private getConversationsUseCase: GetConversationsUseCase,
    private conversationService?: ConversationService
  ) {}

  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;

      const conversations = await this.getConversationsUseCase.execute(tenantId);

      res.status(200).json({ data: conversations });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      logger.error({ event: "controller.conversations.list.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async takeOver(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = (req as Request & { auth: AuthContext }).auth;
      const conversationId = req.params.conversationId as string;

      if (!this.conversationService) {
        res.status(500).json({ error: "Service not available" });
        return;
      }

      const conversation = await this.conversationService.takeOver(conversationId, tenantId, userId);
      res.json({ data: conversation });
    } catch (error) {
      logger.error({ event: "controller.conversations.takeOver.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async release(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = (req as Request & { auth: AuthContext }).auth;
      const conversationId = req.params.conversationId as string;

      if (!this.conversationService) {
        res.status(500).json({ error: "Service not available" });
        return;
      }

      const conversation = await this.conversationService.releaseToAI(conversationId, tenantId, userId);
      res.json({ data: conversation });
    } catch (error) {
      logger.error({ event: "controller.conversations.release.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
