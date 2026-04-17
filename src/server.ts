import "dotenv/config";

import { buildApp } from "./app";
import { prisma } from "./lib/prisma";
import { logger } from "./lib/logger";

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
import { PromptService } from "./modules/ai/promptService";

// Use cases & Http
import { ProcessIncomingMessageUseCase } from "./application/useCases/ProcessIncomingMessageUseCase";
import { WebhookController } from "./modules/webhook/WebhookController";
import { buildWebhookRoutes } from "./routes/webhook";
import { startIncomingMessageWorker, startOutboundMessageWorker } from "./application/workers/messageWorker";
import { ConversationStateService } from "./domain/conversation/ConversationStateService";
import { startCronJobs } from "./interfaces/cron/scheduler";

async function bootstrap() {
  const whatsappProvider = process.env.NODE_ENV === "production" 
    ? new CloudAPIProvider() 
    : new MockWhatsAppProvider();

  const whatsappService = new WhatsAppService(whatsappProvider);
  const promptService = new PromptService();

  const conversationRepo = new PrismaConversationRepository(prisma);
  const messageRepo = new PrismaMessageRepository(prisma);
  const tenantRepo = new PrismaTenantRepository(prisma);
  const appointmentRepo = new PrismaAppointmentRepository(prisma);
  const logRepo = new PrismaLogRepository(prisma);
  const rateLimiter = new RedisRateLimiter();
  const stateService = new ConversationStateService(conversationRepo);

  const schedulingService = new SchedulingService(whatsappService, appointmentRepo, logRepo);
  
  const conversationService = new ConversationService(conversationRepo);
  const messageService = new MessageService(messageRepo);
  const intentService = new IntentService();
  const flowService = new ConversationFlowService(stateService);
  const responseService = new ResponseService();

  const processMessageUseCase = new ProcessIncomingMessageUseCase(
    tenantRepo,
    rateLimiter,
    conversationService,
    messageService,
    intentService,
    flowService,
    responseService
  );
  const webhookController = new WebhookController();
  
  // Start Queue Workers
  startIncomingMessageWorker(processMessageUseCase);
  startOutboundMessageWorker(messageRepo, whatsappService);

  // Start crons
  startCronJobs(schedulingService, logRepo);

  const webhookRoutes = buildWebhookRoutes(webhookController);
  const app = buildApp(webhookRoutes);

  // start server
  const PORT = process.env.PORT || 3000;

  const server = app.listen(PORT, () => {
    logger.info({ msg: "clinicos_running", port: PORT });
  });

  const shutdown = async () => {
    logger.info({ msg: "shutting_down" });

    server.close(() => {
      logger.info({ msg: "http_server_closed" });
    });

    await prisma.$disconnect();
    logger.info({ msg: "database_disconnected" });

    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  process.on("unhandledRejection", (reason) => {
    logger.error({ msg: "unhandled_rejection", error: reason });
  });

  process.on("uncaughtException", (error) => {
    logger.error({ msg: "uncaught_exception", error });
    process.exit(1);
  });
}

bootstrap().catch(err => {
  logger.error({ msg: "bootstrap_failed", error: err });
  process.exit(1);
});
