import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env";
import { AuthContext } from "../types";
import { logger } from "../../../lib/logger";

interface JwtPayload {
  userId: string;
  tenantId: string;
  role: string;
}

/**
 * JWT authentication middleware.
 * Extracts and validates JWT from Authorization: Bearer <token> header.
 * Attaches auth context to request for downstream controllers/use cases.
 */
export function jwtAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn({ event: "auth.missing_token", path: req.path });
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    if (!decoded.userId || !decoded.tenantId) {
      logger.warn({ event: "auth.invalid_payload", path: req.path });
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }

    const auth: AuthContext = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role || "user",
    };

    (req as Request & { auth: AuthContext }).auth = auth;
    
    // Inject tenantId into AsyncLocalStorage for Prisma RLS
    import("../../../lib/requestContext").then(({ asyncLocalStorage }) => {
      asyncLocalStorage.run({ requestId: req.headers["x-request-id"] as string || crypto.randomUUID(), tenantId: decoded.tenantId }, () => {
        next();
      });
    }).catch(err => {
      logger.error({ event: "auth.als_setup_failed", error: err });
      next(err);
    });
  } catch (error) {
    logger.warn({ event: "auth.invalid_token", path: req.path, error });
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
