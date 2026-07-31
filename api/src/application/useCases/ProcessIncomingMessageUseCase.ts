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
import { AIOrchestrator } from "../../modules/ai/AIOrchestrator";

export class ProcessIncomingMessageUseCase {
  constructor(
    private tenantRepo: ITenantRepository,
    private rateLimiter: IRateLimiter,
    private conversationService: ConversationService,
    private messageService: MessageService,
    private intentService: IntentService,
    private flowService: ConversationFlowService,
    private responseService: ResponseService,
    private aiOrchestrator?: AIOrchestrator
  ) {}

  async execute(value: any) {
    if (!value?.messages || value.messages.length === 0) return;

    const message = value.messages[0];
    const requestId = value.requestId || "req-" + Date.now();

    if (!message || (!message.text?.body && !message.audio?.id) || !message.from) {
      logger.warn({
        event: "message.invalid_payload",
        requestId,
        payload: {
          hasText: !!message?.text?.body,
          hasAudio: !!message?.audio?.id,
          from: message?.from,
        },
      });
      return;
    }

    const messageId: string = message.id;
    const phone: string = message.from;
    let text: string = "";

    if (message.type === "audio" && message.audio?.id) {
      const { AudioTranscriptionProvider } = await import("../../infrastructure/llm/AudioTranscriptionProvider");
      text = await AudioTranscriptionProvider.transcribe(message.audio.id);
    } else {
      text = message.text?.body || "";
    }
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

    if (tenant.subscriptionStatus === "past_due" || tenant.subscriptionStatus === "canceled") {
      logger.warn({ event: "tenant_subscription_blocked", tenantId: tenant.id, status: tenant.subscriptionStatus });
      // Depending on the product definition, we could send a default "temporarily unavailable" message
      // or simply ignore. We'll ignore to avoid AI billing costs.
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

        // Generate response — prefer AI orchestrator, fallback to rule-based
        let responseText: string;
        if (this.aiOrchestrator) {
          responseText = await this.aiOrchestrator.generateResponse(conversation.id, tenantId, text, phone, conversation.patientId || undefined);
        } else {
          responseText = await this.responseService.generate(classification.intent, tenantId, phone, text);
        }

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
