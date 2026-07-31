import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { ILLMProvider } from "../../interfaces/llm/ILLMProvider";
import { outboundMessageQueue } from "../queues/messageQueue";
import { MessageDirection } from "../../modules/conversations/types";
import { randomUUID } from "crypto";

export class FollowUpWorker {
  constructor(private llmProvider: ILLMProvider) {}

  async run() {
    try {
      // Find pending follow-ups that are due
      const dueFollowUps = await prisma.followUp.findMany({
        where: {
          status: "PENDING",
          triggerAt: { lte: new Date() }
        },
        include: {
          patient: true
        },
        take: 50
      });

      if (dueFollowUps.length === 0) return;

      logger.info({ event: "follow_up_worker.started", count: dueFollowUps.length });

      for (const followUp of dueFollowUps) {
        try {
          // Generate message using LLM
          const prompt = `Você é um assistente de clínica médica amigável.
Gere uma mensagem curta de follow-up (acompanhamento) para o paciente ${followUp.patient.name}.
O objetivo deste contato é: ${followUp.intent}.
Seja atencioso, profissional e conciso.`;

          const response = await this.llmProvider.chat([{ role: "user", content: prompt }]);
          const generatedMessage = response.content || "Olá! Como você está se sentindo hoje? Estamos entrando em contato para saber como está a sua evolução.";

          // Create or find an active conversation for this patient
          let conversation = await prisma.conversation.findFirst({
            where: { tenantId: followUp.tenantId, patientId: followUp.patientId },
            orderBy: { updatedAt: "desc" }
          });

          if (!conversation || conversation.status === "CLOSED") {
            conversation = await prisma.conversation.create({
              data: {
                tenantId: followUp.tenantId,
                patientId: followUp.patientId,
                phone: followUp.patient.phone,
                status: "AUTO"
              }
            });
          }

          const outboundId = `outbound-${randomUUID()}`;

          // Save message to DB
          const msg = await prisma.message.create({
            data: {
              conversationId: conversation.id,
              direction: MessageDirection.OUTBOUND,
              content: generatedMessage,
              outboundId,
              status: "PENDING"
            }
          });

          // Enqueue for sending
          await outboundMessageQueue.add("send-message", {
            messageId: msg.id,
            phone: followUp.patient.phone,
            content: generatedMessage
          });

          // Mark follow-up as SENT
          await prisma.followUp.update({
            where: { id: followUp.id },
            data: { status: "SENT" }
          });

          logger.info({ event: "follow_up_worker.processed", followUpId: followUp.id });
        } catch (error) {
          logger.error({ event: "follow_up_worker.error_processing", followUpId: followUp.id, error });
        }
      }
    } catch (error) {
      logger.error({ event: "follow_up_worker.error", error });
    }
  }
}
