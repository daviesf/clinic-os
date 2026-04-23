import { IIntentHandler, IntentHandlerContext } from "../IIntentHandler";
import { logger } from "../../../lib/logger";

/**
 * SAFETY-CRITICAL HANDLER
 *
 * This handler deliberately does NOT use the template service.
 * The emergency response message is hardcoded to prevent accidental
 * medical advice through template misconfiguration.
 */
const EMERGENCY_SAFE_MESSAGE =
  "Atenção: se você está em uma situação de emergência médica, por favor " +
  "dirija-se imediatamente ao pronto-socorro mais próximo ou ligue para o " +
  "SAMU (192). Sua mensagem foi encaminhada para nossa equipe de atendimento.";

export class EmergencyIntentHandler implements IIntentHandler {
  async handle(context: IntentHandlerContext): Promise<string> {
    logger.error({
      event: "emergency.escalation",
      tenantId: context.tenantId,
      phone: context.phone,
      content: context.content,
      severity: "CRITICAL",
    });

    return EMERGENCY_SAFE_MESSAGE;
  }
}
