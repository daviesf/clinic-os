import { Conversation, Message, Tenant, Appointment, Log, Prisma } from "@prisma/client";

export interface IConversationRepository {
  findByPhone(tenantId: string, phone: string): Promise<Conversation | null>;
  create(data: { tenantId: string; phone: string; status: any }): Promise<Conversation>;
  updateStatus(id: string, status: any): Promise<Conversation>;
}

export interface IMessageRepository {
  create(data: {
    conversationId: string;
    direction: any;
    content: string;
    externalId?: string | null;
    outboundId?: string | null;
    status?: string;
  }): Promise<Message>;
  findByOutboundId(outboundId: string): Promise<Message | null>;
  updateStatus(id: string, status: string): Promise<Message>;
}

export interface ITenantRepository {
  findByPhoneNumberId(phoneNumberId: string): Promise<Tenant | null>;
}

export interface IAppointmentRepository {
  findForTomorrow(tenantId?: string): Promise<(Appointment & { tenant?: Tenant })[]>;
  create(data: { tenantId: string; patientName: string; phone: string; date: Date }): Promise<Appointment>;
  countConflicts(tenantId: string, start: Date, end: Date): Promise<number>;
}

export interface ILogRepository {
  deleteOlderThan(date: Date): Promise<void>;
}

