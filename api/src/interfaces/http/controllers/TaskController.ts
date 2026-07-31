import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma";
import { AuthContext } from "../types";
import { logger } from "../../../lib/logger";

export class TaskController {
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const { status } = req.query;

      const where: any = { tenantId };
      if (status) {
        where.status = status;
      }

      const tasks = await prisma.task.findMany({
        where,
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        include: {
          patient: {
            select: { id: true, name: true, phone: true }
          }
        }
      });

      res.json({ data: tasks });
    } catch (error) {
      logger.error({ event: "controller.task.list.error", error });
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const { title, description, status, priority, dueDate, patientId } = req.body;

      if (!title) {
        res.status(400).json({ error: "Title is required" });
        return;
      }

      const task = await prisma.task.create({
        data: {
          tenantId,
          title,
          description,
          status: status || "PENDING",
          priority: priority || "MEDIUM",
          dueDate: dueDate ? new Date(dueDate) : null,
          patientId
        }
      });

      res.status(201).json({ data: task });
    } catch (error) {
      logger.error({ event: "controller.task.create.error", error });
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const id = req.params.id as string;
      const { title, description, status, priority, dueDate, patientId } = req.body;

      const task = await prisma.task.update({
        where: { id, tenantId },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(status && { status }),
          ...(priority && { priority }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          ...(patientId !== undefined && { patientId }),
        }
      });

      res.json({ data: task });
    } catch (error) {
      logger.error({ event: "controller.task.update.error", error });
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const id = req.params.id as string;
      await prisma.task.delete({
        where: { id, tenantId }
      });

      res.status(204).send();
    } catch (error) {
      logger.error({ event: "controller.task.delete.error", error });
      next(error);
    }
  };
}
