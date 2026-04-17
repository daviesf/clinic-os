import { IIntentHandler } from "../IIntentHandler";

export class DefaultIntentHandler implements IIntentHandler {
  async handle(context: { tenantId: string; phone: string; content: string; intent: string }): Promise<string> {
    return "Olá! Sou o assistente virtual. Como posso ajudar?";
  }
}
