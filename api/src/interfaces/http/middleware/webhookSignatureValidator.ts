import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { logger } from "../../../lib/logger";

/**
 * Validates the x-hub-signature-256 header from WhatsApp webhook requests.
 * Uses HMAC SHA-256 with the app secret to verify request authenticity.
 * 
 * IMPORTANT: Requires raw body to be available on req as (req as any).rawBody.
 * This is set by the express.json verify callback in app.ts.
 */
export function webhookSignatureValidator(appSecret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // GET requests (verification challenges) don't have signatures
    if (req.method === "GET") {
      next();
      return;
    }

    // Skip validation in development if no secret is configured
    if (!appSecret && process.env.NODE_ENV !== "production") {
      next();
      return;
    }

    const signature = req.headers["x-hub-signature-256"] as string | undefined;

    if (!signature) {
      logger.warn({ event: "webhook.missing_signature", path: req.path });
      res.status(403).json({ error: "Missing signature" });
      return;
    }

    const rawBody = (req as any).rawBody as Buffer | undefined;

    if (!rawBody) {
      logger.error({ event: "webhook.missing_raw_body" });
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    const expectedSignature = "sha256=" + crypto
      .createHmac("sha256", appSecret)
      .update(rawBody)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      logger.warn({ event: "webhook.invalid_signature" });
      res.status(403).json({ error: "Invalid signature" });
      return;
    }

    next();
  };
}
