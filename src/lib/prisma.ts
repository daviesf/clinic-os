import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const basePrisma = new PrismaClient();

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const start = Date.now();
        const result = await query(args);
        const durationMs = Date.now() - start;
        logger.info({ msg: "db_query", model, operation, durationMs });
        return result;
      },
    },
  },
}) as unknown as PrismaClient; // Cast to PrismaClient to avoid massive type refactors everywhere
