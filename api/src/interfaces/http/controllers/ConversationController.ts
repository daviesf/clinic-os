import { Request, Response } from "express";
import { GetConversationsUseCase } from "../../../application/useCases/GetConversationsUseCase";
import { AuthContext } from "../types";
import { AppError } from "../../../lib/errors";
import { logger } from "../../../lib/logger";

export class ConversationController {
  constructor(private getConversationsUseCase: GetConversationsUseCase) {}

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
}
