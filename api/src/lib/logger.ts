import pino from "pino";
import { getContext } from "./requestContext";

const baseLogger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
            singleLine: false,
          },
        }
      : undefined,
});

function serializeError(error: any) {
  if (!(error instanceof Error)) return error;

  const isAxiosError =
    (error as any).isAxiosError ||
    ((error as any).response && (error as any).config);

  return {
    type: error.name || "Error",
    name: error.name,
    message: error.message,
    ...(isAxiosError
      ? {
          status: (error as any).response?.status,
          responseData: (error as any).response?.data,
          url: (error as any).config?.url,
        }
      : {}),
    stack: error.stack,
  };
}

function injectContext(obj: Record<string, any>): Record<string, any> {
  const ctx = getContext();
  if (!ctx) return { ...obj };

  return {
    ...obj,
    ...(ctx.requestId && { requestId: ctx.requestId }),
    ...(ctx.messageId && { messageId: ctx.messageId }),
    ...(ctx.phone && { phone: ctx.phone }),
    ...(ctx.tenantId && { tenantId: ctx.tenantId }),
  };
}


export const logger = {
  info(obj: Record<string, any>): void {
    const data = injectContext(obj);
    baseLogger.info(data);
  },

  warn(obj: Record<string, any>): void {
    const data = injectContext(obj);
    if (data.error) data.error = serializeError(data.error);
    baseLogger.warn(data);
  },

  error(obj: Record<string, any>): void {
    const data = injectContext(obj);
    if (data.error) data.error = serializeError(data.error);
    baseLogger.error(data);
  },

  debug(obj: Record<string, any>): void {
    const data = injectContext(obj);
    baseLogger.debug(data);
  },
};
