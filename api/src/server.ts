import "dotenv/config";

import { buildApp } from "./app";
import { prisma } from "./lib/prisma";
import { logger } from "./lib/logger";
import { env } from "./config/env";

// Repositories
import {
  PrismaConversationRepository,
  PrismaMessageRepository,
  PrismaTenantRepository,
  PrismaAppointmentRepository,
  PrismaLogRepository
} from "./infrastructure/persistence/PrismaRepositories";
import { RedisRateLimiter } from "./infrastructure/redis/RedisRateLimiter";

// Services and Domain
import { CloudAPIProvider } from "./providers/whatsapp/CloudAPIProvider";
import { MockWhatsAppProvider } from "./providers/whatsapp/MockWhatsAppProvider";
import { WhatsAppService } from "./modules/whatsapp/service";
import { SchedulingService } from "./modules/scheduling/service";
import { ConversationService } from "./modules/conversations/ConversationService";
import { MessageService } from "./modules/conversations/MessageService";
import { IntentService } from "./modules/conversations/IntentService";
import { ConversationFlowService } from "./modules/conversations/ConversationFlowService";
import { ResponseService } from "./modules/conversations/ResponseService";
import { ConfigResponseTemplateService } from "./modules/conversations/ConfigResponseTemplateService";
import { IntentHandlerRegistry } from "./domain/intent/IntentHandlerRegistry";

// Use cases
import { ProcessIncomingMessageUseCase } from "./application/useCases/ProcessIncomingMessageUseCase";
import { GetConversationsUseCase } from "./application/useCases/GetConversationsUseCase";
import { GetMessagesUseCase } from "./application/useCases/GetMessagesUseCase";
import { SendMessageUseCase } from "./application/useCases/SendMessageUseCase";

// HTTP layer
import { WebhookController } from "./modules/webhook/WebhookController";
import { ConversationController } from "./interfaces/http/controllers/ConversationController";
import { MessageController } from "./interfaces/http/controllers/MessageController";
import { buildWebhookRoutes } from "./routes/webhook";
import { buildApiRoutes } from "./interfaces/http/routes/index";
import { webhookSignatureValidator } from "./interfaces/http/middleware/webhookSignatureValidator";

// Workers & Cron
import { startIncomingMessageWorker, startOutboundMessageWorker } from "./application/workers/messageWorker";
import { ConversationStateService } from "./domain/conversation/ConversationStateService";
import { startCronJobs } from "./interfaces/cron/scheduler";

async function bootstrap() {
  // --- Infrastructure ---
  const whatsappProvider = process.env.NODE_ENV === "production" 
    ? new CloudAPIProvider() 
    : new MockWhatsAppProvider();

  const whatsappService = new WhatsAppService(whatsappProvider);

  const conversationRepo = new PrismaConversationRepository(prisma);
  const messageRepo = new PrismaMessageRepository(prisma);
  const tenantRepo = new PrismaTenantRepository(prisma);
  const appointmentRepo = new PrismaAppointmentRepository(prisma);
  const logRepo = new PrismaLogRepository(prisma);
  const rateLimiter = new RedisRateLimiter();
  const stateService = new ConversationStateService(conversationRepo);

  // --- Domain Services ---
  const schedulingService = new SchedulingService(whatsappService, appointmentRepo, logRepo);
  const conversationService = new ConversationService(conversationRepo);
  const messageService = new MessageService(messageRepo);
  const intentService = new IntentService();
  const flowService = new ConversationFlowService(stateService);
  const intentRegistry = new IntentHandlerRegistry();
  const templateService = new ConfigResponseTemplateService();
  const responseService = new ResponseService(intentRegistry, templateService);

  // --- Use Cases ---
  const processMessageUseCase = new ProcessIncomingMessageUseCase(
    tenantRepo,
    rateLimiter,
    conversationService,
    messageService,
    intentService,
    flowService,
    responseService
  );

  const getConversationsUseCase = new GetConversationsUseCase(conversationRepo);
  const getMessagesUseCase = new GetMessagesUseCase(conversationRepo, messageRepo);
  const sendMessageUseCase = new SendMessageUseCase(conversationRepo, messageRepo);

  // --- Controllers ---
  const webhookController = new WebhookController();
  const conversationController = new ConversationController(getConversationsUseCase);
  const messageController = new MessageController(getMessagesUseCase, sendMessageUseCase);
  
  // --- Queue Workers ---
  startIncomingMessageWorker(processMessageUseCase);
  startOutboundMessageWorker(messageRepo, whatsappService);

  // --- Cron Jobs ---
  startCronJobs(schedulingService, logRepo);

  // --- HTTP Routes ---
  const signatureValidator = env.WHATSAPP_APP_SECRET
    ? webhookSignatureValidator(env.WHATSAPP_APP_SECRET)
    : undefined;

  const webhookRoutes = buildWebhookRoutes(webhookController, signatureValidator);
  const apiRoutes = buildApiRoutes(conversationController, messageController);
  const app = buildApp(webhookRoutes, apiRoutes);

  // --- Start Server ---
  const PORT = process.env.PORT || 3000;

  const server = app.listen(PORT, () => {
    logger.info({ event: "server.started", port: PORT });
  });

  const shutdown = async () => {
    logger.info({ event: "server.shutting_down" });

    server.close(() => {
      logger.info({ event: "server.http_closed" });
    });

    await prisma.$disconnect();
    logger.info({ event: "server.database_disconnected" });

    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  process.on("unhandledRejection", (reason) => {
    logger.error({ event: "server.unhandled_rejection", error: reason });
  });

  process.on("uncaughtException", (error) => {
    logger.error({ event: "server.uncaught_exception", error });
    process.exit(1);
  });
}

bootstrap().catch(err => {
  logger.error({ event: "server.bootstrap_failed", error: err });
  process.exit(1);
});
