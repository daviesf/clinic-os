import readline from "readline";
import { randomUUID } from "crypto";
import { ConversationService } from "../modules/conversations/ConversationService";
import { MessageService } from "../modules/conversations/MessageService";
import { IntentService } from "../modules/conversations/IntentService";
import { ConversationFlowService } from "../modules/conversations/ConversationFlowService";
import { ResponseService } from "../modules/conversations/ResponseService";
import { PrismaConversationRepository, PrismaMessageRepository } from "../infrastructure/persistence/PrismaRepositories";
import { RedisRateLimiter } from "../infrastructure/redis/RedisRateLimiter";
import { ConversationStateService } from "../domain/conversation/ConversationStateService";
import { ConversationStatus } from "../modules/conversations/types";
import { prisma } from "../lib/prisma";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function runChat() {
  const phone = "551999999999";
  const mockPhoneNumberId = "mock-phone-id-123";

  // Ensure tenant exists
  const tenant = await prisma.tenant.upsert({
    where: { phoneNumberId: mockPhoneNumberId },
    update: {},
    create: {
      name: "Local Dev Tenant",
      phoneNumberId: mockPhoneNumberId,
    },
  });

  const conversationRepo = new PrismaConversationRepository(prisma);
  const messageRepo = new PrismaMessageRepository(prisma);
  const rateLimiter = new RedisRateLimiter();
  const stateService = new ConversationStateService(conversationRepo);
  
  const conversationService = new ConversationService(conversationRepo);
  const messageService = new MessageService(messageRepo);
  const intentService = new IntentService();
  const flowService = new ConversationFlowService(stateService);
  const responseService = new ResponseService();

  console.log("💬 Chat iniciado (Digite 'sair' para encerrar)\n");

  const promptUser = () => {
    rl.question("Você: ", async (input) => {
      if (input.toLowerCase() === "sair") {
        rl.close();
        return;
      }

      if (!input.trim()) {
        promptUser();
        return;
      }

      try {
        if (!(await rateLimiter.checkLimit(phone))) return;

        const conversation = await conversationService.getOrCreate(tenant.id, phone);
        const wamid = `wamid.mock.${randomUUID()}`;
        
        const saved = await messageService.saveInbound(conversation.id, input, wamid);
        if (!saved) return;

        const classification = intentService.classify(input, tenant.id);
        const flowDecision = await flowService.decide(conversation, classification);

        if (flowDecision.action === ConversationStatus.HUMAN) {
          console.log(`🤖 Ação: HUMAN\n`);
        } else {
          const responseText = await responseService.generate(classification.intent, tenant.id, phone, input);
          const hashString = `${phone}-${responseText}-${Math.floor(Date.now() / 60000)}`;
          const outboundId = randomUUID();
          await messageService.saveOutbound(conversation.id, responseText, outboundId, phone);
          console.log(`🤖 ${responseText}\n`);
        }
      } catch (error) {
        console.error("Erro no processamento:", error);
      }

      promptUser();
    });
  };

  promptUser();
}

runChat().catch((err) => {
  console.error("Critical error:", err);
  process.exit(1);
});
