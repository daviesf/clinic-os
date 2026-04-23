import { randomUUID } from "crypto";
import { ConversationService } from "../modules/conversations/ConversationService";
import { MessageService } from "../modules/conversations/MessageService";
import { IntentService } from "../modules/conversations/IntentService";
import { ConversationFlowService } from "../modules/conversations/ConversationFlowService";
import { ResponseService } from "../modules/conversations/ResponseService";
import { PrismaConversationRepository, PrismaMessageRepository } from "../infrastructure/persistence/PrismaRepositories";
import { RedisRateLimiter } from "../infrastructure/redis/RedisRateLimiter";
import { ConversationStateService } from "../domain/conversation/ConversationStateService";
import { IntentHandlerRegistry } from "../domain/intent/IntentHandlerRegistry";
import { ConfigResponseTemplateService } from "../modules/conversations/ConfigResponseTemplateService";
import { ConversationStatus } from "../modules/conversations/types";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";

async function simulate() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: npm run simulate <phone> <message>");
    process.exit(1);
  }

  const phone = args[0];
  const messageText = args.slice(1).join(" ");
  
  // ensure we have a phone_number_id. For testing, we mock it.
  const mockPhoneNumberId = "mock-phone-id-123";

  // Upsert standard tenant for the simulator matching the mock phone number ID
  const tenant = await prisma.tenant.upsert({
    where: { phoneNumberId: mockPhoneNumberId },
    update: {},
    create: {
      name: "Local Dev Tenant",
      phoneNumberId: mockPhoneNumberId,
    }
  });

  logger.info({
    msg: "simulation",
    phone,
    message: messageText
  });

  // Note: webhookHandler might be fire-and-forget in production,
  // but for simulation we might want to call the engine directly to get the response.
  // Wait, if webhookHandler doesn't return the response, we can directly call the engine here for simulation
  // since the prompt instructs to 'Add clear output: Incoming... Response...'.
  const conversationRepo = new PrismaConversationRepository(prisma);
  const messageRepo = new PrismaMessageRepository(prisma);
  const rateLimiter = new RedisRateLimiter();
  const stateService = new ConversationStateService(conversationRepo);
  
  const conversationService = new ConversationService(conversationRepo);
  const messageService = new MessageService(messageRepo);
  const intentService = new IntentService();
  const flowService = new ConversationFlowService(stateService);
  const responseService = new ResponseService(new IntentHandlerRegistry(), new ConfigResponseTemplateService());

  console.log(`\n📩 Incoming: ${messageText}`);

  if (!(await rateLimiter.checkLimit(phone))) return;

  const conversation = await conversationService.getOrCreate(tenant.id, phone);
  const wamid = `wamid.mock.${randomUUID()}`;

  const saved = await messageService.saveInbound(conversation.id, messageText, wamid);
  if (!saved) return;

  const classification = intentService.classify(messageText, tenant.id);
  const flowDecision = await flowService.decide(conversation, classification);

  if (flowDecision.action === ConversationStatus.HUMAN) {
    console.log(`🤖 Action taken: HUMAN\n`);
  } else {
    const responseText = await responseService.generate(classification.intent, tenant.id, phone, messageText);
    const hashString = `${phone}-${responseText}-${Math.floor(Date.now() / 60000)}`;
    const outboundId = randomUUID();
    await messageService.saveOutbound(conversation.id, responseText, outboundId, phone);
    console.log(`🤖 Response: ${responseText}\n`);
  }
}

simulate().catch((error) => {
  logger.error({ msg: "simulation_failed", error });
  process.exit(1);
});
