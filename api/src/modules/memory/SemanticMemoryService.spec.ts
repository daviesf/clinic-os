import { SemanticMemoryService } from "./SemanticMemoryService";
import { ILLMProvider } from "../../interfaces/llm/ILLMProvider";
import { prisma } from "../../lib/prisma";
import * as encryption from "../../lib/encryption";

jest.mock("../../lib/prisma", () => ({
  prisma: {
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn()
  }
}));

jest.mock("../../lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock("../../lib/encryption", () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn()
}));

describe("SemanticMemoryService", () => {
  let llmProviderMock: jest.Mocked<ILLMProvider>;
  let service: SemanticMemoryService;

  beforeEach(() => {
    llmProviderMock = {
      chat: jest.fn(),
      embed: jest.fn()
    } as any;
    service = new SemanticMemoryService(llmProviderMock);
    
    jest.clearAllMocks();
    (encryption.encrypt as jest.Mock).mockImplementation((val) => `encrypted_${val}`);
    (encryption.decrypt as jest.Mock).mockImplementation((val) => val.replace("encrypted_", ""));
  });

  describe("saveFact", () => {
    it("should generate embedding and save fact securely", async () => {
      const tenantId = "tenant_1";
      const patientId = "patient_1";
      const fact = "Patient has allergy to penicillin";
      const mockEmbedding = new Array(1536).fill(0.1);

      llmProviderMock.embed.mockResolvedValue(mockEmbedding);

      await service.saveFact(tenantId, patientId, fact);

      expect(llmProviderMock.embed).toHaveBeenCalledWith(fact);
      expect(encryption.encrypt).toHaveBeenCalledWith(fact);
      expect(prisma.$executeRaw).toHaveBeenCalled();
    });

    it("should throw if embedding is invalid", async () => {
      llmProviderMock.embed.mockResolvedValue(new Array(100).fill(0.1)); // Invalid length

      await expect(service.saveFact("t1", "p1", "test")).rejects.toThrow("Invalid embedding length generated");
      expect(prisma.$executeRaw).not.toHaveBeenCalled();
    });
  });

  describe("retrieveRelevantFacts", () => {
    it("should retrieve, decrypt, and return relevant facts", async () => {
      const tenantId = "tenant_1";
      const patientId = "patient_1";
      const query = "What allergies?";
      const mockEmbedding = new Array(1536).fill(0.2);

      llmProviderMock.embed.mockResolvedValue(mockEmbedding);
      
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { content: "encrypted_Allergy 1" },
        { content: "encrypted_Allergy 2" }
      ]);

      const results = await service.retrieveRelevantFacts(tenantId, patientId, query, 2);

      expect(llmProviderMock.embed).toHaveBeenCalledWith(query);
      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(encryption.decrypt).toHaveBeenCalledTimes(2);
      expect(results).toEqual(["Allergy 1", "Allergy 2"]);
    });

    it("should return empty array on invalid embedding length", async () => {
      llmProviderMock.embed.mockResolvedValue([0.1, 0.2]);

      const results = await service.retrieveRelevantFacts("t1", "p1", "query");
      expect(results).toEqual([]);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });
  });
});
