import { PrismaClient } from "@prisma/client";
import cron from "node-cron";
import { WhatsAppService } from "../whatsapp/service";

const prisma = new PrismaClient();

export class SchedulingService {
    constructor(private whatsappService: WhatsAppService) {
        this.scheduleDailyReminders();
    }

    // Jobs
    private scheduleDailyReminders() {
        // Todo dia 08:00
        cron.schedule("0 8 * * *", async () => {
            console.log("Running daily reminders...");
            await this.sendDailyReminders();
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
                        lt: afterTomorrow
                    },
                    status: "SCHEDULED"
                },
                include: {
                    tenant: true
                }
            });

            for (const appt of appointments) {
                const message = `Olá ${appt.patientName}, lembrete de sua consulta amanhã às ${appt.date.getHours()}:${appt.date.getMinutes().toString().padStart(2, '0')}.`;
                try {
                    // Simple hygiene for phone number - Evolution usually takes raw numbers or remoteJid
                    // Assuming Evolution Provider handles formatting if needed, but for now passing as is or basic clean
                    const phone = appt.phone;
                    await this.whatsappService.sendMessage(appt.tenantId, phone, message);
                } catch (error) {
                    console.error(`Failed to send reminder for appointment ${appt.id}`, error);
                }
            }
        } catch (error) {
            console.error("Error in sendDailyReminders:", error);
        }
    }

    // Service methods
    async createAppointment(tenantId: string, patientName: string, phone: string, date: Date) {
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
            }
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
                    lt: end
                }
            }
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
                    lt: afterTomorrow
                }
            }
        });
    }
}
