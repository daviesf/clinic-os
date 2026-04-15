import cron from "node-cron";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { WhatsAppService } from "../whatsapp/service";

export class SchedulingService {
  constructor(private whatsappService: WhatsAppService) {
    this.scheduleDailyReminders();
  }

  // Jobs
  private scheduleDailyReminders() {
    // Todo dia 08:00
    cron.schedule("0 8 * * *", async () => {
      logger.info({ msg: "running_daily_reminders" });
      await this.sendDailyReminders();
    });

    // Todo dia 03:00 (Log cleanup)
    cron.schedule("0 3 * * *", async () => {
      logger.info({ msg: "running_log_cleanup" });
      try {
        const threshold = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 14 days
        await prisma.log.deleteMany({
          where: { createdAt: { lt: threshold } },
        });
      } catch (error) {
        logger.error({ msg: "log_cleanup_failed", error });
      }
    });
  }

  private async sendDailyReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const afterTomorrow = new Date(tomorrow);
      afterTomorrow.setDate(tomorrow.getDate() + 1);

      const appointments = await prisma.appointment.findMany({
        where: {
          date: {
            gte: tomorrow,
            lt: afterTomorrow,
          },
          status: "SCHEDULED",
        },
        take: 500, // Pagination safety limit
        include: {
          tenant: true,
        },
      });

      for (const appt of appointments) {
        const message = `Olá ${appt.patientName}, lembrete de sua consulta amanhã às ${appt.date.getHours()}:${appt.date.getMinutes().toString().padStart(2, "0")}.`;
        try {
          const phone = appt.phone;
          await this.whatsappService.sendMessage(phone, message);
        } catch (error) {
          logger.error({
            msg: "reminder_send_failed",
            appointmentId: appt.id,
            error,
          });
        }
      }
    } catch (error) {
      logger.error({ msg: "daily_reminders_error", error });
    }
  }

  // Service methods
  async createAppointment(
    tenantId: string,
    patientName: string,
    phone: string,
    date: Date,
  ) {
    const conflict = await this.checkConflict(tenantId, date);
    if (conflict) {
      throw new Error("Horário indisponível");
    }

    return prisma.appointment.create({
      data: {
        tenantId,
        patientName,
        phone,
        date,
      },
    });
  }

  async checkConflict(tenantId: string, date: Date): Promise<boolean> {
    // Check if there is an appointment within 30 mins window (mock rule)
    const start = new Date(date);
    const end = new Date(date.getTime() + 30 * 60000);

    const count = await prisma.appointment.count({
      where: {
        tenantId,
        date: {
          gte: start,
          lt: end,
        },
      },
    });

    return count > 0;
  }

  async getAppointmentsForTomorrow(tenantId: string) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const afterTomorrow = new Date(tomorrow);
    afterTomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.appointment.findMany({
      where: {
        tenantId,
        date: {
          gte: tomorrow,
          lt: afterTomorrow,
        },
      },
      take: 100, // Pagination safety limit
    });
  }
}
