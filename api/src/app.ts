import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { AppError } from "./lib/errors";
import { logger } from "./lib/logger";

export function buildApp(webhookRoutes: express.Router, apiRoutes: express.Router) {
  const app = express();

  app.use(cors());

  // Parse JSON with raw body capture for webhook signature validation
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }));

  // Routes
  app.use(webhookRoutes);
  app.use("/api", apiRoutes);

  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Global error handler — must be AFTER all routes
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: err.message,
      });
      return;
    }

    logger.error({
      event: "unhandled_error",
      error: err.message,
      stack: err.stack,
    });

    res.status(500).json({
      error: "Internal Server Error",
    });
  });

  return app;
}
