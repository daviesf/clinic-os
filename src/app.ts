import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { logger } from "./lib/logger";

export function buildApp(webhookRoutes: express.Router) {
  const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use(webhookRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Global error handler — must be AFTER all routes
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    msg: "unhandled_error",
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    error: "Internal Server Error",
  });
});
  return app;
}
