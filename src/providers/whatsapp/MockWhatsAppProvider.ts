import { IWhatsAppProvider } from "./IWhatsAppProvider";

export class MockWhatsAppProvider implements IWhatsAppProvider {
  async sendMessage(to: string, message: string) {
    console.log("📤 MOCK SEND:", { to, message });
    return { mockMessageId: "mock-id-1234" };
  }
}
