import { PrismaClient, Conversation, Message, Tenant, Appointment, Log, Prisma } from "@prisma/client";
import {
  IConversationRepository,
  IMessageRepository,
  ITenantRepository,
  IAppointmentRepository,
  ILogRepository,
  ConversationWithLastMessage
} from "../../application/interfaces/repositories";

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
      lastMessage: conv.messages[0]?.content ?? null,
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
    return this.prisma.message.create({
      data,
    });
  }

  async findByOutboundId(outboundId: string): Promise<Message | null> {
    return this.prisma.message.findUnique({
      where: { outboundId },
    });
  }

  async findByConversation(conversationId: string): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
  }

  async updateStatus(id: string, status: string): Promise<Message> {
    return this.prisma.message.update({
      where: { id },
      data: { status },
    });
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
}

export class PrismaLogRepository implements ILogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async deleteOlderThan(date: Date): Promise<void> {
    await this.prisma.log.deleteMany({
      where: { createdAt: { lt: date } }
    });
  }
}
