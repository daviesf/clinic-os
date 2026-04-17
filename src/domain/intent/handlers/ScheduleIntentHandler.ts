import { IIntentHandler } from "../IIntentHandler";

export class ScheduleIntentHandler implements IIntentHandler {
  async handle(context: { tenantId: string; phone: string; content: string; intent: string }): Promise<string> {
    return "Para agendar, por favor informe a data e hora desejada.";
  }
}
