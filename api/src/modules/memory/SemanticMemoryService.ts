import { prisma } from "../../lib/prisma";
import { ILLMProvider } from "../../interfaces/llm/ILLMProvider";
import { logger } from "../../lib/logger";
import { encrypt, decrypt } from "../../lib/encryption";

export class SemanticMemoryService {
  constructor(private llmProvider: ILLMProvider) {}

  async saveFact(tenantId: string, patientId: string, fact: string): Promise<void> {
    try {
      // Generate embedding for the fact
      const embedding = await this.llmProvider.embed(fact);
      
      if (!embedding || embedding.length !== 1536) {
         throw new Error("Invalid embedding length generated");
      }

      const encryptedFact = encrypt(fact);
      // We need to use Prisma raw query to insert vector type properly
      await prisma.$executeRaw`
        INSERT INTO "SemanticMemory" ("id", "tenantId", "patientId", "content", "embedding", "createdAt")
        VALUES (
          gen_random_uuid(),
          ${tenantId},
          ${patientId},
          ${encryptedFact},
          ${embedding}::vector,
          NOW()
        )
      `;

      logger.info({ event: "semantic_memory.saved", tenantId, patientId, fact });
    } catch (error) {
      logger.error({ event: "semantic_memory.save_error", error, tenantId, patientId });
      throw error;
    }
  }

  async retrieveRelevantFacts(tenantId: string, patientId: string, query: string, limit: number = 3): Promise<string[]> {
    try {
      const queryEmbedding = await this.llmProvider.embed(query);

      if (!queryEmbedding || queryEmbedding.length !== 1536) {
        throw new Error("Invalid query embedding length");
      }

      // Uses vector similarity search (<=> is cosine distance in pgvector)
      const results = await prisma.$queryRaw<{ content: string }[]>`
        SELECT content
        FROM "SemanticMemory"
        WHERE "tenantId" = ${tenantId} AND "patientId" = ${patientId}
        ORDER BY "embedding" <=> ${queryEmbedding}::vector
        LIMIT ${limit}
      `;

      return results.map(r => decrypt(r.content));
    } catch (error) {
      logger.error({ event: "semantic_memory.retrieve_error", error, tenantId, patientId });
      return [];
    }
  }
}
