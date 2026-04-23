import { redisClient } from "./client";
import { logger } from "../../lib/logger";

/**
 * Distributed lock using Redis SET NX EX pattern.
 * Prevents duplicate cron/job execution across multiple containers.
 */
export class RedisLock {
  async acquire(key: string, ttlSeconds: number): Promise<boolean> {
    // SET key value NX EX ttl — atomic set-if-not-exists with TTL
    const result = await redisClient.set(
      `lock:${key}`,
      Date.now().toString(),
      "EX",
      ttlSeconds,
      "NX"
    );

    const acquired = result === "OK";

    if (!acquired) {
      logger.debug({ event: "redis_lock.not_acquired", key });
    }

    return acquired;
  }

  async release(key: string): Promise<void> {
    await redisClient.del(`lock:${key}`);
  }
}
