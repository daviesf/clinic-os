import { IIntentHandler, IntentHandlerContext } from "../IIntentHandler";
import { MessageIntent } from "../../../modules/conversations/types";

export class DefaultIntentHandler implements IIntentHandler {
  async handle(context: IntentHandlerContext): Promise<string> {
    return context.templateService.getTemplate(MessageIntent.UNKNOWN, {
      tenantId: context.tenantId,
      phone: context.phone,
      content: context.content,
      intent: context.intent,
    });
  }
}
