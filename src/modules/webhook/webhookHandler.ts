import { handleStatus } from "./handlers/handleStatus";
import { handleIncomingMessage } from "./handlers/handleIncomingMessage";
import { randomUUID } from "node:crypto";

const handlers = [handleStatus, handleIncomingMessage];

export async function webhookHandler(value: any) {
  if (!value) return;

  const requestId = randomUUID();
  
  const contextValue = {
    ...value,
    requestId
  }

  for (const handler of handlers) {
    await handler(contextValue);
  }
}
