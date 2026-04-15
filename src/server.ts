import "dotenv/config";

import app from "./app";
import { prisma } from "./lib/prisma";
import { logger } from "./lib/logger";
import { conversationEngine, schedulingService } from "./container";

// start server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info({ msg: "clinicos_running", port: PORT });
});

const shutdown = async () => {
  logger.info({ msg: "shutting_down" });

  server.close(() => {
    logger.info({ msg: "http_server_closed" });
  });

  await prisma.$disconnect();
  logger.info({ msg: "database_disconnected" });

  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Safety: catch unhandled rejections
process.on("unhandledRejection", (reason) => {
  logger.error({ msg: "unhandled_rejection", error: reason });
});

process.on("uncaughtException", (error) => {
  logger.error({ msg: "uncaught_exception", error });
  process.exit(1);
});
