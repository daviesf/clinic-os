import { IntentHandlerRegistry } from "../../domain/intent/IntentHandlerRegistry";
import { IResponseTemplateService } from "../../domain/responseTemplates/IResponseTemplateService";
import { MessageIntent } from "./types";
import { logger } from "../../lib/logger";

export class ResponseService {
  constructor(
    private readonly intentRegistry: IntentHandlerRegistry,
    private readonly templateService: IResponseTemplateService
  ) {}

  async generate(intent: MessageIntent, tenantId: string, phone: string, content: string): Promise<string> {
    const handler = this.intentRegistry.getHandler(intent);

    try {
      return await handler.handle({
        tenantId,
        phone,
        content,
        intent,
        templateService: this.templateService,
      });
    } catch (error) {
      logger.error({
        event: "response_service.handler_error",
        intent,
        tenantId,
        error,
      });
      return this.templateService.getTemplate(MessageIntent.UNKNOWN, {
        tenantId,
        phone,
        content,
        intent,
      });
    }
  }
}
