import { PrismaClient, Conversation, Message, Tenant, Appointment, Log, Patient, Prisma } from "@prisma/client";
import { encrypt, decrypt } from "../../lib/encryption";
import {
  IConversationRepository,
  IMessageRepository,
  ITenantRepository,
  IAppointmentRepository,
  ILogRepository,
  IPatientRepository,
  ConversationWithLastMessage
} from "../../application/interfaces/repositories";

export class PrismaPatientRepository implements IPatientRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(tenantId: string, id: string): Promise<Patient | null> {
    return this.prisma.patient.findFirst({
      where: { id, tenantId }
    });
  }

  async findAll(tenantId: string, params: { search?: string; skip?: number; take?: number }): Promise<{ data: Patient[]; total: number }> {
    const where: Prisma.PatientWhereInput = {
      tenantId,
      ...(params.search ? {
        OR: [
          { name: { contains: params.search, mode: "insensitive" as const } },
          { phone: { contains: params.search } }
        ]
      } : {})
    };

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.patient.count({ where })
    ]);

    return { data, total };
  }

  async create(data: Omit<Prisma.PatientUncheckedCreateInput, "id" | "createdAt">): Promise<Patient> {
    return this.prisma.patient.create({ data });
  }

  async update(tenantId: string, id: string, data: Partial<Patient>): Promise<Patient> {
    return this.prisma.patient.update({
      where: { id },
      data
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.patient.delete({
      where: { id }
    });
  }
}

export class PrismaConversationRepository implements IConversationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByPhone(tenantId: string, phone: string): Promise<Conversation | null> {
    return this.prisma.conversation.findFirst({
      where: { tenantId, phone },
    });
  }

  async findById(id: string): Promise<Conversation | null> {
    return this.prisma.conversation.findUnique({
      where: { id },
    });
  }

  async findAllByTenant(tenantId: string): Promise<ConversationWithLastMessage[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
      include: {
        patient: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true },
        },
      },
    });

    return conversations.map((conv) => ({
      ...conv,
      messages: undefined as any,
      lastMessage: conv.messages[0] ? decrypt(conv.messages[0].content) : null,
    }));
  }

  async create(data: { tenantId: string; phone: string; status: any }): Promise<Conversation> {
    return this.prisma.conversation.create({
      data,
    });
  }

  async updateStatus(id: string, status: any): Promise<Conversation> {
    return this.prisma.conversation.update({
      where: { id },
      data: { status }
    });
  }
}

export class PrismaMessageRepository implements IMessageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    conversationId: string;
    direction: any;
    content: string;
    externalId?: string | null;
    outboundId?: string | null;
    status?: string;
  }): Promise<Message> {
    const encryptedData = { ...data, content: encrypt(data.content) };
    const msg = await this.prisma.message.create({
      data: encryptedData,
    });
    return { ...msg, content: decrypt(msg.content) };
  }

  async findByOutboundId(outboundId: string): Promise<Message | null> {
    const msg = await this.prisma.message.findUnique({
      where: { outboundId },
    });
    if (msg) msg.content = decrypt(msg.content);
    return msg;
  }

  async findByConversation(conversationId: string): Promise<Message[]> {
    const msgs = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    return msgs.map(m => ({ ...m, content: decrypt(m.content) }));
  }

  async updateStatus(id: string, status: string): Promise<Message> {
    const msg = await this.prisma.message.update({
      where: { id },
      data: { status },
    });
    return { ...msg, content: decrypt(msg.content) };
  }
}

export class PrismaTenantRepository implements ITenantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByPhoneNumberId(phoneNumberId: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({
      where: { phoneNumberId },
    });
  }
}

export class PrismaAppointmentRepository implements IAppointmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findForTomorrow(tenantId?: string): Promise<(Appointment & { tenant?: Tenant })[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const afterTomorrow = new Date(tomorrow);
    afterTomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.appointment.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        date: { gte: tomorrow, lt: afterTomorrow },
        status: "SCHEDULED"
      },
      take: 500,
      include: { tenant: true }
    });
  }

  async countConflicts(tenantId: string, start: Date, end: Date): Promise<number> {
    return this.prisma.appointment.count({
      where: {
        tenantId,
        date: { gte: start, lt: end }
      }
    });
  }

  async create(data: { tenantId: string; patientName: string; phone: string; date: Date }): Promise<Appointment> {
    return this.prisma.appointment.create({ data });
  }

  async countByPhone(tenantId: string, phone: string, since: Date): Promise<number> {
    return this.prisma.appointment.count({
      where: {
        tenantId,
        phone,
        createdAt: { gte: since }
      }
    });
  }
}

export class PrismaLogRepository implements ILogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async deleteOlderThan(date: Date): Promise<void> {
    await this.prisma.log.deleteMany({
      where: { createdAt: { lt: date } }
    });
  }
}
