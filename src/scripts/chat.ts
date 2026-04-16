import readline from "readline";
import { randomUUID } from "crypto";
import { conversationEngine } from "../container";
import { prisma } from "../lib/prisma";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function runChat() {
  const phone = "551999999999";
  const mockPhoneNumberId = "mock-phone-id-123";

  // Ensure tenant exists
  const tenant = await prisma.tenant.upsert({
    where: { phoneNumberId: mockPhoneNumberId },
    update: {},
    create: {
      name: "Local Dev Tenant",
      phoneNumberId: mockPhoneNumberId,
    },
  });

  console.log("💬 Chat iniciado (Digite 'sair' para encerrar)\n");

  const promptUser = () => {
    rl.question("Você: ", async (input) => {
      if (input.toLowerCase() === "sair") {
        rl.close();
        return;
      }

      if (!input.trim()) {
        promptUser();
        return;
      }

      try {
        const engineResponse = await conversationEngine.handleIncomingMessage(
          tenant.id,
          phone,
          input,
          `wamid.mock.${randomUUID()}`
        );

        if (engineResponse && engineResponse.response) {
          console.log(`🤖 ${engineResponse.response}\n`);
        } else {
          console.log(`🤖 Ação: ${engineResponse?.action || "None"}\n`);
        }
      } catch (error) {
        console.error("Erro no processamento:", error);
      }

      promptUser();
    });
  };

  promptUser();
}

runChat().catch((err) => {
  console.error("Critical error:", err);
  process.exit(1);
});
