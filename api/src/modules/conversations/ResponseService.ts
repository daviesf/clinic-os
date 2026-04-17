import { IntentHandlerRegistry } from "../../domain/intent/IntentHandlerRegistry";
import { MessageIntent } from "./types";

export class ResponseService {
  private intentRegistry: IntentHandlerRegistry;

  constructor() {
    this.intentRegistry = new IntentHandlerRegistry();
  }

  async generate(intent: MessageIntent, tenantId: string, phone: string, content: string): Promise<string> {
    const handler = this.intentRegistry.getHandler(intent);
    
    return await handler.handle({
      tenantId,
      phone,
      content,
      intent
    });
  }
}
