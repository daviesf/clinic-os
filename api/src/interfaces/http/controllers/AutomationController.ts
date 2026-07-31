import { Request, Response } from "express";
import { AuthContext } from "../types";
import { prisma } from "../../../lib/prisma";
import { logger } from "../../../lib/logger";

export class AutomationController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      
      const followUps = await prisma.followUp.findMany({
        where: { tenantId },
        include: {
          patient: {
            select: { name: true, phone: true }
          }
        },
        orderBy: { triggerAt: "asc" }
      });
      
      res.status(200).json({ data: followUps });
    } catch (error) {
      logger.error({ event: "controller.automation.list.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const { patientId, triggerAt, intent } = req.body;
      
      const followUp = await prisma.followUp.create({
        data: {
          tenantId,
          patientId,
          triggerAt: new Date(triggerAt),
          intent,
          status: "PENDING"
        }
      });

      res.status(201).json({ data: followUp });
    } catch (error) {
      logger.error({ event: "controller.automation.create.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const id = req.params.id as string;
      
      const followUp = await prisma.followUp.findUnique({
        where: { id }
      });
      
      if (!followUp || followUp.tenantId !== tenantId) {
        res.status(404).json({ error: "FollowUp not found" });
        return;
      }

      await prisma.followUp.delete({
        where: { id }
      });

      res.status(200).json({ success: true });
    } catch (error) {
      logger.error({ event: "controller.automation.delete.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
