import Redis from "ioredis-mock";
import { logger } from "../../lib/logger";

export const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

redisClient.on("error", (error: any) => {
  logger.error({ event: "redis_error", error });
});

redisClient.on("connect", () => {
  logger.info({ event: "redis_connected_mock" });
});
