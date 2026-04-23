import { Request, Response } from "express";
import { GetMessagesUseCase } from "../../../application/useCases/GetMessagesUseCase";
import { SendMessageUseCase } from "../../../application/useCases/SendMessageUseCase";
import { AuthContext } from "../types";
import { AppError } from "../../../lib/errors";
import { logger } from "../../../lib/logger";

export class MessageController {
  constructor(
    private getMessagesUseCase: GetMessagesUseCase,
    private sendMessageUseCase: SendMessageUseCase
  ) {}

  async list(req: Request, res: Response): Promise<void> {
    try {
      const conversationId = req.params.conversationId as string;
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;

      if (!conversationId) {
        res.status(400).json({ error: "Missing conversationId parameter" });
        return;
      }

      const messages = await this.getMessagesUseCase.execute(conversationId, tenantId);

      res.status(200).json({ data: messages });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      logger.error({ event: "controller.messages.list.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async send(req: Request, res: Response): Promise<void> {
    try {
      const conversationId = req.params.conversationId as string;
      const { content } = req.body;
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;

      if (!conversationId) {
        res.status(400).json({ error: "Missing conversationId parameter" });
        return;
      }

      if (!content || typeof content !== "string" || content.trim().length === 0) {
        res.status(400).json({ error: "Message content is required and must be a non-empty string" });
        return;
      }

      const message = await this.sendMessageUseCase.execute(conversationId, content, tenantId);

      res.status(201).json({ data: message });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      logger.error({ event: "controller.messages.send.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
