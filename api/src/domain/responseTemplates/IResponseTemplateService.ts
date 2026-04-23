import { MessageIntent } from "../../modules/conversations/types";

export interface TemplateContext {
  tenantId: string;
  phone: string;
  content: string;
  intent: string;
}

export interface IResponseTemplateService {
  getTemplate(intent: MessageIntent, context: TemplateContext): Promise<string>;
}
