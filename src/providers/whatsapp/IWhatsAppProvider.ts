export interface IWhatsAppProvider {
    createInstance(tenantId: string): Promise<any>;
    deleteInstance(tenantId: string): Promise<void>;
    getQRCode(tenantId: string): Promise<string | null>;
    sendMessage(tenantId: string, phone: string, message: string): Promise<any>;
    setWebhook(tenantId: string, url: string): Promise<void>;
}
