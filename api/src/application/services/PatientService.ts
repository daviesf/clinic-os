import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { IPatientRepository } from "../interfaces/repositories";
import { Patient, Prisma } from "@prisma/client";

export class PatientService {
  constructor(private patientRepo: IPatientRepository) {}

  async findById(tenantId: string, id: string): Promise<Patient | null> {
    return this.patientRepo.findById(tenantId, id);
  }

  async getPatient360(tenantId: string, id: string) {
    const patient = await prisma.patient.findFirst({
      where: { id, tenantId },
      include: {
        conversations: {
          orderBy: { updatedAt: "desc" },
          take: 5
        },
        semanticMemories: {
          orderBy: { createdAt: "desc" },
          take: 10
        },
        episodicMemories: {
          orderBy: { createdAt: "desc" },
          take: 10
        }
      }
    });

    if (!patient) return null;

    // Fetch appointments (since there is no direct relation between Appointment and Patient yet, we match by phone)
    const appointments = await prisma.appointment.findMany({
      where: { tenantId, phone: patient.phone },
      orderBy: { date: "desc" },
      take: 10
    });

    return { ...patient, appointments };
  }

  async findAll(tenantId: string, params: { search?: string; skip?: number; take?: number }) {
    return this.patientRepo.findAll(tenantId, params);
  }

  async create(data: Omit<Prisma.PatientUncheckedCreateInput, "id" | "createdAt">): Promise<Patient> {
    return this.patientRepo.create(data);
  }

  async update(tenantId: string, id: string, data: Partial<Patient>): Promise<Patient> {
    return this.patientRepo.update(tenantId, id, data);
  }

  async anonymizePatient(tenantId: string, patientId: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Delete vector data
        await tx.semanticMemory.deleteMany({
          where: { tenantId, patientId }
        });

        await tx.episodicMemory.deleteMany({
          where: { tenantId, patientId }
        });

        // Get conversations to delete messages
        const conversations = await tx.conversation.findMany({
          where: { tenantId, patientId },
          select: { id: true }
        });

        const conversationIds = conversations.map(c => c.id);

        if (conversationIds.length > 0) {
          // Delete messages
          await tx.message.deleteMany({
            where: { conversationId: { in: conversationIds } }
          });
        }

        // Anonymize the patient
        await tx.patient.update({
          where: { id: patientId, tenantId },
          data: {
            name: "ANONIMIZADO",
            phone: `ANON-${patientId.substring(0, 8)}`,
          }
        });

        // Anonymize related appointments
        await tx.appointment.updateMany({
          where: { tenantId, patientId },
          data: {
            patientName: "ANONIMIZADO",
            phone: "00000000000"
          }
        });
      });

      logger.info({ event: "patient.anonymized", tenantId, patientId });
    } catch (error) {
      logger.error({ event: "patient.anonymize_error", error, tenantId, patientId });
      throw error;
    }
  }
}
