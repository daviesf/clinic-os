import { Request, Response, NextFunction } from "express";
import { redisClient } from "../../../infrastructure/redis/client";
import { logger } from "../../../lib/logger";

export const rateLimiterMiddleware = (options: { maxAllowed: number, windowMs: number }) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
      return next();
    }
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
      const key = `ratelimit:auth:${ip}`;
      
      const count = await redisClient.incr(key);
      
      if (count === 1) {
        await redisClient.pexpire(key, options.windowMs);
      }
      
      if (count > options.maxAllowed) {
        logger.warn({ event: "rate_limit_exceeded", ip, path: req.path });
        res.status(429).json({ error: "Too many requests. Please try again later." });
        return;
      }
      
      next();
    } catch (error) {
      logger.error({ event: "rate_limit_error", error });
      // Proceed to allow the request so auth is not completely blocked on redis failure
      next();
    }
  };
};
