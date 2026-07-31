import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma";
import { AuthContext } from "../types";
import { logger } from "../../../lib/logger";

export class AppointmentController {
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;

      const appointments = await prisma.appointment.findMany({
        where: { tenantId },
        orderBy: { date: "asc" },
      });

      res.json({ data: appointments });
    } catch (error) {
      logger.error({ event: "controller.appointment.list.error", error });
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const { patientName, phone, date, status, patientId } = req.body;

      const appointment = await prisma.appointment.create({
        data: {
          tenantId,
          patientName,
          phone,
          date: new Date(date),
          status: status || "SCHEDULED",
          patientId
        }
      });

      res.status(201).json({ data: appointment });
    } catch (error) {
      logger.error({ event: "controller.appointment.create.error", error });
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const id = req.params.id as string;
      const { patientName, phone, date, status, patientId } = req.body;

      const appointment = await prisma.appointment.update({
        where: { id, tenantId },
        data: {
          ...(patientName && { patientName }),
          ...(phone && { phone }),
          ...(date && { date: new Date(date) }),
          ...(status && { status }),
          ...(patientId && { patientId }),
        }
      });

      res.json({ data: appointment });
    } catch (error) {
      logger.error({ event: "controller.appointment.update.error", error });
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const id = req.params.id as string;

      await prisma.appointment.delete({
        where: { id, tenantId }
      });

      res.status(204).send();
    } catch (error) {
      logger.error({ event: "controller.appointment.delete.error", error });
      next(error);
    }
  };
}
