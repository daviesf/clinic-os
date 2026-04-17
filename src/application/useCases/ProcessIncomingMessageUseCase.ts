import { logger } from "../../lib/logger";
import crypto from "crypto";
import { asyncLocalStorage, RequestContext } from "../../lib/requestContext";
import { ITenantRepository } from "../interfaces/repositories";
import { ConversationService } from "../../modules/conversations/ConversationService";
import { MessageService } from "../../modules/conversations/MessageService";
import { IntentService } from "../../modules/conversations/IntentService";
import { ConversationFlowService } from "../../modules/conversations/ConversationFlowService";
import { ResponseService } from "../../modules/conversations/ResponseService";
import { IRateLimiter } from "../interfaces/IRateLimiter";
import { ConversationStatus } from "../../modules/conversations/types";

export class ProcessIncomingMessageUseCase {
  constructor(
    private tenantRepo: ITenantRepository,
    private rateLimiter: IRateLimiter,
    private conversationService: ConversationService,
    private messageService: MessageService,
    private intentService: IntentService,
    private flowService: ConversationFlowService,
    private responseService: ResponseService
  ) {}

  async execute(value: any) {
    if (!value?.messages || value.messages.length === 0) return;

    const message = value.messages[0];
    const requestId = value.requestId || "req-" + Date.now();

    if (!message?.text?.body || !message?.from) {
      logger.warn({
        event: "message.invalid_payload",
        requestId,
        payload: {
          hasText: !!message.text?.body,
          from: message.from,
        },
      });
      return;
    }

    const messageId: string = message.id;
    const phone: string = message.from;
    const text: string = message.text.body;
    const phoneNumberId = value.metadata?.phone_number_id;

    if (!phoneNumberId) {
      logger.warn({ event: "missing_phone_number_id", value });
      return;
    }

    const tenant = await this.tenantRepo.findByPhoneNumberId(phoneNumberId);

    if (!tenant) {
      logger.warn({ event: "tenant_not_found", phoneNumberId });
      return;
    }

    const tenantId = tenant.id;

    const context: RequestContext = {
      requestId,
      messageId,
      phone,
      tenantId,
    };

    await asyncLocalStorage.run(context, async () => {
      const start = Date.now();
      try {
        if (!(await this.rateLimiter.checkLimit(phone))) return;

        logger.info({
          event: "message.received",
          content: text,
        });

        const conversation = await this.conversationService.getOrCreate(tenantId, phone);

        const saved = await this.messageService.saveInbound(conversation.id, text, messageId);
        if (!saved) return; // duplicate

        logger.info({
          event: "message.persisted",
          conversationId: conversation.id,
        });

        const currentAction = conversation.status;
        logger.info({
          event: "message.action",
          action: currentAction,
        });

        if (currentAction === ConversationStatus.HUMAN) {
           logger.info({
            event: "message.processed",
            phone,
            success: true,
          });
          return;
        }

        const classification = this.intentService.classify(text, tenantId);

        const flowDecision = await this.flowService.decide(conversation, classification);

        logger.info({
          event: "message.classified",
          intent: classification.intent,
          priority: classification.priority,
          action: flowDecision.action,
          score: classification.score,
        });

        // Don't auto-respond if escalated to HUMAN
        if (flowDecision.action === ConversationStatus.HUMAN) {
           return;
        }

        const responseText = await this.responseService.generate(classification.intent, tenantId, phone, text);

        logger.info({
          event: "message.response",
          response: responseText,
        });

        const windowMinutes = Math.floor(Date.now() / 60000);
        const hashString = `${phone}-${responseText}-${windowMinutes}`;
        const outboundId = crypto
          .createHash("sha256")
          .update(hashString)
          .digest("hex");

        await this.messageService.saveOutbound(conversation.id, responseText, outboundId, phone);

        logger.info({
          event: "message.processed",
          phone,
          success: true,
        });

      } catch (error) {
        logger.error({
          event: "webhook.error",
          error,
        });
      } finally {
        const durationMs = Date.now() - start;
        logger.info({
          event: "message.done",
          durationMs,
        });
      }
    });
  }
}
