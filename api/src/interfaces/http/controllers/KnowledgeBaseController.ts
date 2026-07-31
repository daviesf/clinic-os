import { Request, Response } from "express";
import { AuthContext } from "../types";
import { prisma } from "../../../lib/prisma";
import { logger } from "../../../lib/logger";

export class KnowledgeBaseController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      
      const items = await prisma.knowledgeBase.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          type: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      res.status(200).json({ data: items });
    } catch (error) {
      logger.error({ event: "controller.knowledgebase.list.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const id = req.params.id as string;
      
      const item = await prisma.knowledgeBase.findUnique({
        where: { id }
      });
      
      if (!item || item.tenantId !== tenantId) {
        res.status(404).json({ error: "Item not found" });
        return;
      }
      
      res.status(200).json({ data: item });
    } catch (error) {
      logger.error({ event: "controller.knowledgebase.get.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const { title, content, type } = req.body;
      
      const item = await prisma.knowledgeBase.create({
        data: {
          tenantId,
          title,
          content,
          type: type || "TEXT"
        }
      });
      
      if (process.env.OPENAI_API_KEY) {
        try {
          const { OpenAIProvider } = require("../../../infrastructure/llm/OpenAIProvider");
          const openai = new OpenAIProvider();
          const embedding = await openai.embed(title + "\n" + content);
          
          if (embedding && embedding.length > 0) {
            await prisma.$executeRaw`
              UPDATE "KnowledgeBase" 
              SET embedding = ${embedding}::vector 
              WHERE id = ${item.id}
            `;
          }
        } catch (embedError) {
          logger.error({ event: "controller.knowledgebase.create.embed_error", error: embedError });
        }
      }
      res.status(201).json({ data: item });
    } catch (error) {
      logger.error({ event: "controller.knowledgebase.create.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const id = req.params.id as string;
      
      const item = await prisma.knowledgeBase.findUnique({
        where: { id }
      });
      
      if (!item || item.tenantId !== tenantId) {
        res.status(404).json({ error: "Item not found" });
        return;
      }

      await prisma.knowledgeBase.delete({
        where: { id }
      });

      res.status(200).json({ success: true });
    } catch (error) {
      logger.error({ event: "controller.knowledgebase.delete.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
