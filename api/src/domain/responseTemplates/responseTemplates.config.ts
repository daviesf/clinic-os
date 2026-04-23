import { MessageIntent } from "../../modules/conversations/types";

/**
 * Response template configuration.
 *
 * Supported variables for interpolation: {{phone}}, {{intent}}, {{content}}, {{tenantId}}
 *
 * IMPORTANT: The EMERGENCY template is safety-critical. The EmergencyIntentHandler
 * overrides this with a hardcoded safe message to prevent accidental medical advice
 * through template misconfiguration.
 */
export const RESPONSE_TEMPLATES: Record<string, string> = {
  [MessageIntent.SCHEDULE]:
    "Olá! Para agendar sua consulta, por favor informe a data e horário desejados. " +
    "Nosso horário de atendimento é de segunda a sexta, das 8h às 18h.",

  [MessageIntent.UNKNOWN]:
    "Olá! Sou o assistente virtual da clínica. Como posso ajudá-lo(a) hoje? " +
    "Posso ajudar com agendamento de consultas, informações sobre horários e muito mais.",
};

/**
 * Fallback template used when no template is found for a given intent.
 */
export const FALLBACK_TEMPLATE =
  "Olá! Sou o assistente virtual. Como posso ajudá-lo(a)?";
