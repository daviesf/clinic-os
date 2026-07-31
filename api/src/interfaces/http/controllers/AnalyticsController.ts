import { Request, Response } from "express";
import { AuthContext } from "../types";
import { prisma } from "../../../lib/prisma";
import { logger } from "../../../lib/logger";

export class AnalyticsController {
  async getDashboardData(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Conversas
      const totalConversations = await prisma.conversation.count({ where: { tenantId } });
      const humanHandoffs = await prisma.auditLog.count({ where: { tenantId, action: "HANDOFF_HUMAN" } });
      const handoffRate = totalConversations > 0 ? (humanHandoffs / totalConversations) * 100 : 0;
      const aiResolutionRate = 100 - handoffRate;

      const conversationsByStatus = await prisma.conversation.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true
      });

      // Pacientes
      const totalPatients = await prisma.patient.count({ where: { tenantId } });
      const newPatients = await prisma.patient.count({
        where: { tenantId, createdAt: { gte: thirtyDaysAgo } }
      });

      // Consultas
      const appointmentsByStatus = await prisma.appointment.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true
      });

      let appointmentsScheduled = 0;
      let appointmentsCompleted = 0;
      let appointmentsCanceled = 0;

      appointmentsByStatus.forEach(item => {
        if (item.status === 'SCHEDULED') appointmentsScheduled = item._count;
        if (item.status === 'COMPLETED') appointmentsCompleted = item._count;
        if (item.status === 'CANCELED') appointmentsCanceled = item._count;
      });

      res.status(200).json({
        data: {
          totalConversations,
          humanHandoffs,
          aiResolutionRate: Math.max(0, Math.min(100, aiResolutionRate)),
          handoffRate: Math.max(0, Math.min(100, handoffRate)),
          conversationsByStatus,
          totalPatients,
          newPatients,
          appointmentsScheduled,
          appointmentsCompleted,
          appointmentsCanceled
        }
      });
    } catch (error) {
      logger.error({ event: "controller.analytics.getDashboardData.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
