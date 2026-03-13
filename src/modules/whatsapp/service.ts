import { IWhatsAppProvider } from "../../providers/whatsapp/IWhatsAppProvider";

export class WhatsAppService {
    constructor(private provider: IWhatsAppProvider) { }

    async initializeInstance(tenantId: string) {
        return this.provider.createInstance(tenantId);
    }

    async getQRCode(tenantId: string) {
        return this.provider.getQRCode(tenantId);
    }

    async sendMessage(tenantId: string, phone: string, content: string) {
        return this.provider.sendMessage(tenantId, phone, content);
    }

    async createInstance(tenantId: string) {
        return this.provider.createInstance(tenantId);
    }

    async deleteInstance(tenantId: string) {
        return this.provider.deleteInstance(tenantId);
    }

    // Future: webhook handling could be here or in a controller
}
