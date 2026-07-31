import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { AuthUseCase } from "../../../application/useCases/AuthUseCase";
import { prisma } from "../../../lib/prisma";

import { rateLimiterMiddleware } from "../middleware/rateLimiterMiddleware";
import { StripeBillingProvider } from "../../../infrastructure/billing/StripeBillingProvider";

export function buildAuthRoutes(): Router {
  const router = Router();
  
  // Dependencies
  const billingProvider = new StripeBillingProvider();
  const authUseCase = new AuthUseCase(prisma, billingProvider);
  const authController = new AuthController(authUseCase);

  const loginLimiter = rateLimiterMiddleware({ maxAllowed: 5, windowMs: 60000 }); // 5 attempts per minute
  const registerLimiter = rateLimiterMiddleware({ maxAllowed: 3, windowMs: 60 * 60 * 1000 }); // 3 per hour

  router.post("/register", registerLimiter, authController.register);
  router.post("/login", loginLimiter, authController.login);
  router.post("/refresh", authController.refresh);
  router.post("/logout", authController.logout);

  return router;
}
