import pino from "pino";
import { getContext } from "./requestContext";
import { prisma } from "./prisma";

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
            errorLikeObjectKeys: ["error"],
            messageFormat: "{event}",
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

function persistErrorLog(
  level: string,
  data: Record<string, any>,
  eventStr?: string,
): void {
  if (level !== "error" && level !== "warn") return;

  const metadata = { ...data };

  if (metadata.error) {
    metadata.error = { ...metadata.error };
    if (
      typeof metadata.error.stack === "string" &&
      metadata.error.stack.length > 2000
    ) {
      metadata.error.stack =
        metadata.error.stack.substring(0, 2000) + "... (truncated)";
    }
  }

  const message = String(
    eventStr || metadata.error?.message || "unknown_error",
  );

  prisma.log
    .create({
      data: {
        level,
        message,
        metadata: metadata as any,
      },
    })
    .catch(() => {
      // Intentionally ignore database errors during logging fallback
    });
}

export const logger = {
  info(obj: Record<string, any>): void {
    const data = injectContext(obj);
    const event = data.event;
    baseLogger.info({ ...data, event });
  },

  warn(obj: Record<string, any>): void {
    const data = injectContext(obj);
    if (data.error) data.error = serializeError(data.error);
    const event = data.event;
    baseLogger.warn({ ...data, event });
    persistErrorLog("warn", data, event);
  },

  error(obj: Record<string, any>): void {
    const data = injectContext(obj);
    if (data.error) data.error = serializeError(data.error);
    const event = data.event;
    baseLogger.error({ ...data, event });
    persistErrorLog("error", data, event);
  },

  debug(obj: Record<string, any>): void {
    const data = injectContext(obj);
    const event = data.event;
    baseLogger.debug({ ...data, event });
  },
};
