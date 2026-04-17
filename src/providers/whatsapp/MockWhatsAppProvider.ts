import { IWhatsAppProvider, OutboundMessage } from "./IWhatsAppProvider";
import { logger } from "../../lib/logger";

export class MockWhatsAppProvider implements IWhatsAppProvider {
  async sendMessage(payload: OutboundMessage) {
    logger.info({
      msg: "mock_whatsapp_message_sent",
      payload,
    });
    return { status: "ok" };
  }
}
