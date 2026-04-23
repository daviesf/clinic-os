import { MessageIntent } from "./types";
import {
  IResponseTemplateService,
  TemplateContext,
} from "../../domain/responseTemplates/IResponseTemplateService";
import {
  RESPONSE_TEMPLATES,
  FALLBACK_TEMPLATE,
} from "../../domain/responseTemplates/responseTemplates.config";
import { logger } from "../../lib/logger";

export class ConfigResponseTemplateService implements IResponseTemplateService {
  async getTemplate(intent: MessageIntent, context: TemplateContext): Promise<string> {
    const template = RESPONSE_TEMPLATES[intent];

    if (!template) {
      logger.warn({
        event: "template_service.fallback",
        intent,
        tenantId: context.tenantId,
      });
      return this.interpolate(FALLBACK_TEMPLATE, context);
    }

    return this.interpolate(template, context);
  }

  private interpolate(template: string, context: TemplateContext): string {
    return template
      .replace(/\{\{phone\}\}/g, context.phone)
      .replace(/\{\{intent\}\}/g, context.intent)
      .replace(/\{\{content\}\}/g, context.content)
      .replace(/\{\{tenantId\}\}/g, context.tenantId);
  }
}
