export interface IIntentHandler {
  handle(context: {
    tenantId: string;
    phone: string;
    content: string;
    intent: string;
  }): Promise<string>;
}
