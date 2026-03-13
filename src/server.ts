import app from "./app";
import { EvolutionProvider } from "./providers/whatsapp/EvolutionProvider";
import { WhatsAppService } from "./modules/whatsapp/service";
import { SchedulingService } from "./modules/scheduling/service";
import { ConversationEngine } from "./modules/conversations/engine";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

// 0. Validate Environment
if (!process.env.EVOLUTION_BASE_URL || !process.env.EVOLUTION_API_KEY) {
    console.error("FATAL: Missing EVOLUTION_BASE_URL or EVOLUTION_API_KEY in .env");
    process.exit(1);
}

// 1. Setup Dependencies
const whatsappProvider = new EvolutionProvider();
const whatsappService = new WhatsAppService(whatsappProvider);
const prisma = new PrismaClient(); // Implicitly used in modules, but good to have a handle for shutdown

// 2. Initialize Modules
const schedulingService = new SchedulingService(whatsappService);
const conversationEngine = new ConversationEngine(whatsappService);


// 2.1 Test Route for Evolution Integration
app.get("/test-evolution", async (req, res) => {
    const tenant = "testclinic";

    try {
        // Cleanup any existing test instance first
        try {
            await whatsappService.deleteInstance(tenant);
            console.log("Cleaned up existing test instance.");
        } catch (e) {
            // Instance might not exist, that's fine
        }

        // Create instance (EvolutionProvider already polls for QR internally)
        console.log("Creating test instance...");
        const result = await whatsappService.createInstance(tenant);

        let qrBase64: string | null = result?.qrcode?.base64 || null;

        // If QR not in create response, poll separately
        if (!qrBase64) {
            console.log("QR not in create response, polling...");
            for (let i = 0; i < 10; i++) {
                try {
                    qrBase64 = await whatsappService.getQRCode(tenant);
                    if (qrBase64) break;
                } catch (e) {
                    // QR might not be ready yet
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Cleanup test instance
        try {
            await whatsappService.deleteInstance(tenant);
        } catch (e) {
            console.warn("Could not clean up test instance:", e);
        }

        return res.json({
            status: "success",
            qr_code_available: !!qrBase64,
            qr_base64_preview: qrBase64?.substring(0, 80) ?? null
        });

    } catch (error) {
        console.error("Test Evolution failed:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to test Evolution",
            error: String(error)
        });
    }
});

// 3. Start Server
const server = app.listen(3000, () => {
    console.log("Server running on port 3000");
    console.log("Modules initialized: Scheduling, Conversation Engine");
});

// 4. Graceful Shutdown
const shutdown = async () => {
    console.log("Shutting down gracefully...");
    server.close(() => {
        console.log("HTTP server closed.");
    });

    try {
        await prisma.$disconnect();
        console.log("Database disconnected.");
    } catch (err) {
        console.error("Error disconnecting database:", err);
    }

    process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Export instances if needed for testing or future routes
export { whatsappService, schedulingService, conversationEngine };
