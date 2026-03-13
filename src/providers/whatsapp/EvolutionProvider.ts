import axios, { AxiosInstance } from "axios";
import { IWhatsAppProvider } from "./IWhatsAppProvider";

export class EvolutionProvider implements IWhatsAppProvider {
    private api: AxiosInstance;
    private baseUrl: string;
    private apiKey: string;

    constructor() {
        this.baseUrl = (process.env.EVOLUTION_BASE_URL || "").replace(/['"]+/g, '').trim();
        this.apiKey = (process.env.EVOLUTION_API_KEY || "").replace(/['"]+/g, '').trim();

        if (!this.baseUrl || !this.apiKey) {
            throw new Error("Evolution API configuration missing: EVOLUTION_BASE_URL or EVOLUTION_API_KEY not set");
        }

        this.api = axios.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                "apikey": this.apiKey,
                "Content-Type": "application/json"
            }
        });
    }

    async createInstance(tenantId: string): Promise<any> {
        try {
            console.log(`Creating instance for ${tenantId}...`);
            const response = await this.api.post("/instance/create", {
                instanceName: tenantId,
                integration: "WHATSAPP-BAILEYS",
                qrcode: true
            });

            console.log("Instance created:", response.data);

            if (response.data?.qrcode?.base64) {
                return response.data;
            }

            // Poll for QR Code if not immediately available
            return await this.waitForQRCode(tenantId, response.data);
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const data = error.response?.data;
                console.error(`Evolution API Error [${status}] URL: ${this.baseUrl}/instance/create`);
                console.error("Response data:", JSON.stringify(data, null, 2));
                if (status === 403) throw new Error("Forbidden: Invalid API Key or Permissions. Check AUTHENTICATION_API_KEY.");
                if (status === 404) throw new Error("Evolution API endpoint not found. Check EVOLUTION_BASE_URL.");
                if (status === 400) throw new Error(`Bad Request: ${JSON.stringify(data)}`);
                throw new Error(`Evolution API error [${status}]: ${JSON.stringify(data)}`);
            }
            console.error("Non-HTTP error calling Evolution API:", error.message);
            throw error;
        }
    }

    private async waitForQRCode(tenantId: string, initialData: any): Promise<any> {
        let attempts = 0;
        const maxAttempts = 10;
        const delay = 2000;

        while (attempts < maxAttempts) {
            console.log(`Waiting for QR Code (Attempt ${attempts + 1}/${maxAttempts})...`);
            await new Promise(resolve => setTimeout(resolve, delay));

            try {
                const qr = await this.getQRCode(tenantId);
                if (qr) {
                    console.log("QR Code retrieved successfully.");
                    // Return combined data structure
                    return {
                        ...initialData,
                        qrcode: {
                            base64: qr
                        }
                    };
                }
            } catch (e) {
                console.warn("Error checking for QR code, retrying...");
            }
            attempts++;
        }
        console.warn("Timeout waiting for QR Code.");
        return initialData;
    }

    async deleteInstance(tenantId: string): Promise<void> {
        await this.api.delete(`/instance/delete/${tenantId}`);
    }

    async getQRCode(tenantId: string): Promise<string | null> {
        try {
            const response = await this.api.get(`/instance/connect/${tenantId}`);

            if (response.data?.base64) {
                return response.data.base64;
            }

            return null;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                console.error(`Evolution API Error getting QR [${error.response?.status}]:`, error.response?.data);
            }
            throw error;
        }
    }

    async sendMessage(tenantId: string, phone: string, message: string): Promise<any> {
        const number = phone.replace(/\D/g, "");

        const response = await this.api.post(`/message/sendText/${tenantId}`, {
            number,
            textMessage: {
                text: message
            }
        });

        return response.data;
    }

    async setWebhook(tenantId: string, url: string): Promise<void> {
        await this.api.post(`/webhook/set/${tenantId}`, {
            webhookUrl: url,
            webhookByEvents: true,
            events: ["MESSAGES_UPSERT"]
        });
    }
}