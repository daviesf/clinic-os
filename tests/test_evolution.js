const axios = require('axios');

async function testEvolutionIntegration() {
    console.log("=== Evolution API Integration Test ===\n");

    const BASE_URL = process.env.EVOLUTION_BASE_URL || "http://localhost:8080";
    const API_KEY = process.env.EVOLUTION_API_KEY || "supersecretkey";
    const INSTANCE_NAME = "test_instance_" + Date.now();

    console.log(`Target: ${BASE_URL}`);
    console.log(`API Key: ${API_KEY.substring(0, 4)}***`);
    console.log(`Instance: ${INSTANCE_NAME}\n`);

    const api = axios.create({
        baseURL: BASE_URL,
        timeout: 30000,
        headers: {
            "apikey": API_KEY,
            "Content-Type": "application/json"
        }
    });

    try {
        // 1. Create Instance
        console.log("1. Creating instance...");
        const createRes = await api.post("/instance/create", {
            instanceName: INSTANCE_NAME,
            integration: "WHATSAPP-BAILEYS",
            qrcode: true
        });
        console.log("✅ Instance created successfully.");
        console.log("   Status:", createRes.status);
        console.log("   Instance:", createRes.data?.instance?.instanceName);
        console.log("   QR in response:", !!createRes.data?.qrcode?.base64);

        if (createRes.data?.qrcode?.base64) {
            console.log("   QR preview:", createRes.data.qrcode.base64.substring(0, 60) + "...");
        }

        // 2. Fetch QR Code via connect endpoint (with delay)
        console.log("\n2. Waiting 3s then fetching QR Code via /instance/connect...");
        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
            const connectRes = await api.get(`/instance/connect/${INSTANCE_NAME}`);
            if (connectRes.data && connectRes.data.base64) {
                console.log("✅ QR Code retrieved via connect endpoint.");
                console.log("   QR preview:", connectRes.data.base64.substring(0, 60) + "...");
            } else {
                console.log("⚠️ Connect returned but no QR base64:", JSON.stringify(connectRes.data).substring(0, 200));
            }
        } catch (connectErr) {
            console.log("⚠️ Connect endpoint error (may be expected if already connected):",
                connectErr.response?.status, connectErr.response?.data);
        }

        // 3. Cleanup
        console.log("\n3. Cleanup: Deleting instance...");
        await api.delete(`/instance/delete/${INSTANCE_NAME}`);
        console.log("✅ Cleanup successful.");

        console.log("\n=== ALL TESTS PASSED ===");

    } catch (error) {
        console.error("\n❌ Test Failed!");
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error("   Data:", JSON.stringify(error.response.data, null, 2));
            console.error("   URL:", error.config?.url);
        } else {
            console.error("   Error:", error.message);
        }
        process.exit(1);
    }
}

testEvolutionIntegration();
