import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  requestId: string;
  messageId?: string;
  phone?: string;
  tenantId?: string;
}

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export function getContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}
