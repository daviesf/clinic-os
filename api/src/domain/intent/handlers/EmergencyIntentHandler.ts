import { IIntentHandler } from "../IIntentHandler";

export class EmergencyIntentHandler implements IIntentHandler {
  async handle(context: { tenantId: string; phone: string; content: string; intent: string }): Promise<string> {
    return "Por favor, dirija-se imediatamente ao pronto-socorro mais próximo ou ligue para o serviço de emergência.";
  }
}
