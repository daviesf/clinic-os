import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";
import { getContext } from "./requestContext";

const basePrisma = new PrismaClient();

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const start = Date.now();
        const tenantId = getContext()?.tenantId;
        
        let result;
        if (tenantId) {
          const [, queryResult] = await basePrisma.$transaction([
            basePrisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`,
            query(args)
          ]);
          result = queryResult;
        } else {
          const [, queryResult] = await basePrisma.$transaction([
            basePrisma.$executeRaw`SELECT set_config('app.current_tenant_id', '', true)`,
            query(args)
          ]);
          result = queryResult;
        }

        const durationMs = Date.now() - start;
        logger.debug({ msg: "db_query", model, operation, durationMs });
        return result;
      },
    },
  },
}) as unknown as PrismaClient; // Cast to PrismaClient to avoid massive type refactors everywhere
