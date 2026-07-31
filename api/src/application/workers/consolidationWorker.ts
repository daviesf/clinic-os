import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { ILLMProvider } from "../../interfaces/llm/ILLMProvider";
import { encrypt } from "../../lib/encryption";

export class ConsolidationWorker {
  constructor(private llmProvider: ILLMProvider) {}

  async run(inactiveHours: number = 2) {
    try {
      const thresholdTime = new Date(Date.now() - inactiveHours * 60 * 60 * 1000);

      // Encontra conversas que não estão CLOSED e cuja última atualização foi antes do limiar
      const inactiveConversations = await prisma.conversation.findMany({
        where: {
          status: { not: "CLOSED" },
          updatedAt: { lt: thresholdTime },
          patientId: { not: null } // Somente conversas associadas a um paciente
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        },
        take: 50 // processar em lotes
      });

      if (inactiveConversations.length === 0) return;

      logger.info({ event: "consolidation_worker.started", count: inactiveConversations.length });

      for (const conv of inactiveConversations) {
        if (conv.messages.length === 0) {
          // Se não tem mensagens, apenas fechar
          await prisma.conversation.update({
            where: { id: conv.id },
            data: { status: "CLOSED" }
          });
          continue;
        }

        const messagesText = conv.messages.map(m => `[${m.direction}] ${m.content}`).join("\n");
        const prompt = `Resuma a seguinte conversa médica entre a recepcionista/IA e o paciente. 
Extraia os pontos principais, o motivo do contato e o desfecho. 
Seja conciso.\n\nConversa:\n${messagesText}`;

        try {
          // 1. Gera resumo
          const response = await this.llmProvider.chat([{ role: "user", content: prompt }]);
          const summary = response.content || "Resumo não gerado.";

          // 2. Gera embedding do resumo
          const embedding = await this.llmProvider.embed(summary);

          // 3. Salva em EpisodicMemory usando transação com raw query para o vetor
          const encryptedSummary = encrypt(summary);
          await prisma.$transaction(async (tx) => {
            await tx.$executeRaw`
              INSERT INTO "EpisodicMemory" ("id", "tenantId", "patientId", "conversationId", "summary", "embedding", "createdAt")
              VALUES (
                gen_random_uuid(),
                ${conv.tenantId},
                ${conv.patientId},
                ${conv.id},
                ${encryptedSummary},
                ${embedding}::vector,
                NOW()
              )
              ON CONFLICT ("conversationId") DO UPDATE SET
                "summary" = ${encryptedSummary},
                "embedding" = ${embedding}::vector;
            `;

            // Marca conversa como CLOSED
            await tx.conversation.update({
              where: { id: conv.id },
              data: { status: "CLOSED" }
            });
          });

          logger.info({ event: "consolidation_worker.consolidated", conversationId: conv.id });
        } catch (error) {
          logger.error({ event: "consolidation_worker.error_processing_conversation", conversationId: conv.id, error });
        }
      }
    } catch (error) {
      logger.error({ event: "consolidation_worker.error", error });
    }
  }
}
