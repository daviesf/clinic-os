import { logger } from "../../lib/logger";
import { WhatsAppService } from "../whatsapp/service";
import { IAppointmentRepository, ILogRepository } from "../../application/interfaces/repositories";

export class SchedulingService {
  constructor(
    private whatsappService: WhatsAppService,
    private appointmentRepo: IAppointmentRepository,
    private logRepo: ILogRepository
  ) {}

  async sendDailyReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const afterTomorrow = new Date(tomorrow);
      afterTomorrow.setDate(tomorrow.getDate() + 1);

      const appointments = await this.appointmentRepo.findForTomorrow();

      for (const appt of appointments) {
        const message = `Olá ${appt.patientName}, lembrete de sua consulta amanhã às ${appt.date.getHours()}:${appt.date.getMinutes().toString().padStart(2, "0")}.`;
        try {
          const phone = appt.phone;
          await this.whatsappService.sendMessage({ type: "text", to: phone, text: message });
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

    return this.appointmentRepo.create({
      tenantId,
      patientName,
      phone,
      date,
    });
  }

  async checkConflict(tenantId: string, date: Date): Promise<boolean> {
    // Check if there is an appointment within 30 mins window (mock rule)
    const start = new Date(date);
    const end = new Date(date.getTime() + 30 * 60000);

    const count = await this.appointmentRepo.countConflicts(tenantId, start, end);

    return count > 0;
  }

  async getAppointmentsForTomorrow(tenantId: string) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const afterTomorrow = new Date(tomorrow);
    afterTomorrow.setDate(tomorrow.getDate() + 1);

    return this.appointmentRepo.findForTomorrow(tenantId);
  }
}
