import { Redis } from "ioredis";
import { logger } from "../../lib/logger";

export const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

redisClient.on("error", (err) => {
  logger.error({ msg: "redis_error", error: err });
});
