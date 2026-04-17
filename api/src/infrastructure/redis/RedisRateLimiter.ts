import { IRateLimiter } from "../../application/interfaces/IRateLimiter";
import { redisClient } from "./client";

export class RedisRateLimiter implements IRateLimiter {
  private readonly limitWindowMs = 10000;
  private readonly maxAllowed = 15;

  async checkLimit(key: string): Promise<boolean> {
    const redisKey = `ratelimit:${key}`;
    const count = await redisClient.incr(redisKey);
    
    if (count === 1) {
      await redisClient.pexpire(redisKey, this.limitWindowMs);
    }

    return count <= this.maxAllowed;
  }
}
