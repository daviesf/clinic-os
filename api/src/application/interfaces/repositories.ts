import { Conversation, Message, Tenant, Appointment, Log, Patient, Prisma } from "@prisma/client";

export interface IPatientRepository {
  findById(tenantId: string, id: string): Promise<Patient | null>;
  findAll(tenantId: string, params: { search?: string; skip?: number; take?: number }): Promise<{ data: Patient[]; total: number }>;
  create(data: Omit<Prisma.PatientUncheckedCreateInput, "id" | "createdAt">): Promise<Patient>;
  update(tenantId: string, id: string, data: Partial<Patient>): Promise<Patient>;
  delete(tenantId: string, id: string): Promise<void>;
}

export interface ConversationWithLastMessage extends Conversation {
  lastMessage: string | null;
  patient?: any | null;
}

export interface IConversationRepository {
  findByPhone(tenantId: string, phone: string): Promise<Conversation | null>;
  findById(id: string): Promise<Conversation | null>;
  findAllByTenant(tenantId: string): Promise<ConversationWithLastMessage[]>;
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
  findByConversation(conversationId: string): Promise<Message[]>;
  updateStatus(id: string, status: string): Promise<Message>;
}

export interface ITenantRepository {
  findByPhoneNumberId(phoneNumberId: string): Promise<Tenant | null>;
}

export interface IAppointmentRepository {
  findForTomorrow(tenantId?: string): Promise<(Appointment & { tenant?: Tenant })[]>;
  create(data: { tenantId: string; patientName: string; phone: string; date: Date }): Promise<Appointment>;
  countConflicts(tenantId: string, start: Date, end: Date): Promise<number>;
  countByPhone(tenantId: string, phone: string, since: Date): Promise<number>;
}

export interface ILogRepository {
  deleteOlderThan(date: Date): Promise<void>;
}
