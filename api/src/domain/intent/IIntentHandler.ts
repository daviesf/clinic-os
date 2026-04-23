import { IResponseTemplateService } from "../responseTemplates/IResponseTemplateService";

export interface IntentHandlerContext {
  tenantId: string;
  phone: string;
  content: string;
  intent: string;
  templateService: IResponseTemplateService;
}

export interface IIntentHandler {
  handle(context: IntentHandlerContext): Promise<string>;
}
