import { PrismaClient } from "@prisma/client";
import { WhatsAppService } from "../whatsapp/service";

const prisma = new PrismaClient();

export class ConversationEngine {
    constructor(private whatsappService: WhatsAppService) { }

    async handleIncomingMessage(tenantId: string, phone: string, content: string, messageId: string) {
        try {
            // 1. Buscar ou criar conversation
            let conversation = await prisma.conversation.findFirst({
                where: {
                    tenantId,
                    phone
                }
            });

            if (!conversation) {
                conversation = await prisma.conversation.create({
                    data: {
                        tenantId,
                        phone,
                        status: "AUTO"
                    }
                });
            }

            // 2. CRITICAL: Persist message FIRST
            await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    direction: "INBOUND",
                    content: content
                }
            });

            // 3. Se status === "HUMAN" -> retornar
            if (conversation.status === "HUMAN") {
                return;
            }

            // 4. Logic & Response (Protected)
            try {
                // Classify intent (mock)
                const normalizedContent = content.toLowerCase();
                const intent = normalizedContent.includes("agendar") ? "schedule" : "unknown";

                // Handle intent
                if (intent === "schedule") {
                    await this.whatsappService.sendMessage(tenantId, phone, "Para agendar, por favor informe a data e hora desejada.");
                } else {
                    await this.whatsappService.sendMessage(tenantId, phone, "Olá! Sou o assistente virtual. Como posso ajudar?");
                }
            } catch (logicError) {
                console.error("Error processing logic/sending response:", logicError);
                // Message is already saved, so we don't lose data even if logic fails.
            }

        } catch (error) {
            console.error("Critical error in ConversationEngine (Data Loss Risk):", error);
        }
    }
}
