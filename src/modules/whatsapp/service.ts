import { IWhatsAppProvider } from "../../providers/whatsapp/IWhatsAppProvider";

export class WhatsAppService {
  constructor(private provider: IWhatsAppProvider) {}

  async sendMessage(phone: string, content: string) {
    return this.provider.sendMessage(phone, content);
  }
}
