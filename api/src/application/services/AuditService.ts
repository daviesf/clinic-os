import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";

export class AuditService {
  static async log(
    tenantId: string,
    action: string,
    resource: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId,
          action,
          resource,
          userId,
          details: details ? details : undefined,
        },
      });
      logger.info({ event: "audit.logged", action, resource, tenantId });
    } catch (error) {
      logger.error({ event: "audit.error", error, action, resource, tenantId });
    }
  }
}
