import { randomUUID } from "crypto";
import { webhookHandler } from "../modules/webhook/webhookHandler";
import { conversationEngine } from "../container";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";

async function simulate() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: npm run simulate <phone> <message>");
    process.exit(1);
  }

  const phone = args[0];
  const messageText = args.slice(1).join(" ");
  
  // ensure we have a phone_number_id. For testing, we mock it.
  const mockPhoneNumberId = "mock-phone-id-123";

  // Upsert standard tenant for the simulator matching the mock phone number ID
  const tenant = await prisma.tenant.upsert({
    where: { phoneNumberId: mockPhoneNumberId },
    update: {},
    create: {
      name: "Local Dev Tenant",
      phoneNumberId: mockPhoneNumberId,
    }
  });

  logger.info({
    msg: "simulation",
    phone,
    message: messageText
  });

  // Note: webhookHandler might be fire-and-forget in production,
  // but for simulation we might want to call the engine directly to get the response.
  // Wait, if webhookHandler doesn't return the response, we can directly call the engine here for simulation
  // since the prompt instructs to 'Add clear output: Incoming... Response...'.
  // However, handleIncomingMessage needs tenantId. We fetched it above.
  
  console.log(`\n📩 Incoming: ${messageText}`);

  const engineResponse = await conversationEngine.handleIncomingMessage(
    tenant.id,
    phone,
    messageText,
    `wamid.mock.${randomUUID()}`
  );

  if (engineResponse && engineResponse.response) {
    console.log(`🤖 Response: ${engineResponse.response}\n`);
  } else {
    console.log(`🤖 Action taken: ${engineResponse?.action || 'None'}\n`);
  }
}

simulate().catch((error) => {
  logger.error({ msg: "simulation_failed", error });
  process.exit(1);
});
