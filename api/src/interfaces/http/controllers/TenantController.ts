import { Request, Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma";
import { AuthContext } from "../types";
import { logger } from "../../../lib/logger";

export class TenantController {
  getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          name: true,
          specialty: true,
          promptConfig: true,
          businessHours: true,
          phoneNumberId: true,
          clinicAddress: true,
          clinicTimezone: true,
          aiModel: true,
          aiTemperature: true,
          autoHandoff: true,
          whatsappToken: true,
          webhookVerifyToken: true,
        },
      });

      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      res.json({ data: tenant });
    } catch (error) {
      logger.error({ event: "controller.tenant.getSettings.error", error });
      next(error);
    }
  };

  updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const { 
        name, specialty, promptConfig, businessHours, phoneNumberId,
        clinicAddress, clinicTimezone, aiModel, aiTemperature, autoHandoff,
        whatsappToken, webhookVerifyToken 
      } = req.body;

      const updated = await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          ...(name !== undefined && { name }),
          ...(specialty !== undefined && { specialty }),
          ...(promptConfig !== undefined && { promptConfig }),
          ...(businessHours !== undefined && { businessHours }),
          ...(phoneNumberId !== undefined && { phoneNumberId }),
          ...(clinicAddress !== undefined && { clinicAddress }),
          ...(clinicTimezone !== undefined && { clinicTimezone }),
          ...(aiModel !== undefined && { aiModel }),
          ...(aiTemperature !== undefined && { aiTemperature: parseFloat(aiTemperature) }),
          ...(autoHandoff !== undefined && { autoHandoff }),
          ...(whatsappToken !== undefined && { whatsappToken }),
          ...(webhookVerifyToken !== undefined && { webhookVerifyToken }),
        },
        select: {
          id: true,
          name: true,
          specialty: true,
          promptConfig: true,
          businessHours: true,
          phoneNumberId: true,
          clinicAddress: true,
          clinicTimezone: true,
          aiModel: true,
          aiTemperature: true,
          autoHandoff: true,
          whatsappToken: true,
          webhookVerifyToken: true,
        },
      });

      res.json({ data: updated });
    } catch (error) {
      logger.error({ event: "controller.tenant.updateSettings.error", error });
      next(error);
    }
  };
}
