import { IWhatsAppProvider, OutboundMessage } from "../../providers/whatsapp/IWhatsAppProvider";

export class WhatsAppService {
  constructor(private provider: IWhatsAppProvider) {}

  async sendMessage(payload: OutboundMessage) {
    return this.provider.sendMessage(payload);
  }
}
