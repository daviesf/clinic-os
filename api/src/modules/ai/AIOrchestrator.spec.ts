import { AIOrchestrator } from "./AIOrchestrator";
import { ILLMProvider, LLMResponse } from "../../interfaces/llm/ILLMProvider";
import { IMessageRepository, IAppointmentRepository } from "../../application/interfaces/repositories";
import { SemanticMemoryService } from "../memory/SemanticMemoryService";

// Mock prisma
jest.mock("../../lib/prisma", () => ({
  prisma: {
    tenant: {
      findUnique: jest.fn().mockResolvedValue({ promptConfig: "Tenant prompt", name: "Test Clinic", specialty: "General" })
    },
    $queryRaw: jest.fn().mockResolvedValue([])
  }
}));

describe("AIOrchestrator", () => {
  let orchestrator: AIOrchestrator;
  let mockLLMProvider: jest.Mocked<ILLMProvider>;
  let mockMessageRepo: jest.Mocked<IMessageRepository>;

  beforeEach(() => {
    mockLLMProvider = {
      chat: jest.fn(),
      generateEmbedding: jest.fn()
    } as any;

    mockMessageRepo = {
      findByConversation: jest.fn().mockResolvedValue([]),
    } as any;

    orchestrator = new AIOrchestrator(mockLLMProvider, mockMessageRepo);
  });

  it("should generate a response without tool calls", async () => {
    mockLLMProvider.chat.mockResolvedValue({
      content: "Hello, how can I help?",
      toolCalls: []
    });

    const response = await orchestrator.generateResponse("conv_1", "tenant_1", "Hi");

    expect(response).toBe("Hello, how can I help?");
    expect(mockLLMProvider.chat).toHaveBeenCalledTimes(1);
    
    const messagesArg = mockLLMProvider.chat.mock.calls[0][0];
    expect(messagesArg[0].role).toBe("system");
    expect(messagesArg[0].content).toContain("[CRÍTICO - DIRETRIZ MÉDICA INVIOLÁVEL]");
    expect(messagesArg[messagesArg.length - 1].content).toBe("Hi");
  });

  it("should handle check_availability tool call", async () => {
    mockLLMProvider.chat.mockResolvedValueOnce({
      content: "",
      toolCalls: [{ name: "check_availability", arguments: { date: "2026-06-21T10:00:00Z" } }]
    }).mockResolvedValueOnce({
      content: "Yes, it is available.",
      toolCalls: []
    });

    const mockApptRepo = { countConflicts: jest.fn().mockResolvedValue(0) } as any;
    orchestrator = new AIOrchestrator(mockLLMProvider, mockMessageRepo, mockApptRepo);

    const response = await orchestrator.generateResponse("conv_1", "tenant_1", "Is 10am available?");
    expect(response).toBe("Yes, it is available.");
    expect(mockApptRepo.countConflicts).toHaveBeenCalled();
  });

  it("should handle book_appointment tool call", async () => {
    mockLLMProvider.chat.mockResolvedValueOnce({
      content: "",
      toolCalls: [{ name: "book_appointment", arguments: { date: "2026-06-21T10:00:00Z", patientName: "John" } }]
    }).mockResolvedValueOnce({
      content: "Appointment booked.",
      toolCalls: []
    });

    const mockApptRepo = { countByPhone: jest.fn().mockResolvedValue(0), create: jest.fn().mockResolvedValue({ id: "appt_1" }) } as any;
    orchestrator = new AIOrchestrator(mockLLMProvider, mockMessageRepo, mockApptRepo);

    const response = await orchestrator.generateResponse("conv_1", "tenant_1", "Book it", "123");
    expect(response).toBe("Appointment booked.");
    expect(mockApptRepo.create).toHaveBeenCalled();
  });

  it("should block excessive book_appointment calls", async () => {
    mockLLMProvider.chat.mockResolvedValueOnce({
      content: "",
      toolCalls: [{ name: "book_appointment", arguments: { date: "2026-06-21T10:00:00Z", patientName: "John" } }]
    }).mockResolvedValueOnce({
      content: "Error message from LLM",
      toolCalls: []
    });

    const mockApptRepo = { countByPhone: jest.fn().mockResolvedValue(4), create: jest.fn() } as any;
    orchestrator = new AIOrchestrator(mockLLMProvider, mockMessageRepo, mockApptRepo);

    await orchestrator.generateResponse("conv_1", "tenant_1", "Book it", "123");
    expect(mockApptRepo.create).not.toHaveBeenCalled();
  });

  it("should handle semantic memory retrieval and save_patient_fact", async () => {
    mockLLMProvider.chat.mockResolvedValueOnce({
      content: "",
      toolCalls: [{ name: "save_patient_fact", arguments: { fact: "Patient is allergic to peanuts" } }]
    }).mockResolvedValueOnce({
      content: "Fact saved.",
      toolCalls: []
    });

    const mockSemanticMemory = { retrieveRelevantFacts: jest.fn().mockResolvedValue(["Past fact"]), saveFact: jest.fn().mockResolvedValue(true) } as any;
    orchestrator = new AIOrchestrator(mockLLMProvider, mockMessageRepo, undefined, mockSemanticMemory);

    const response = await orchestrator.generateResponse("conv_1", "tenant_1", "I am allergic to peanuts", "123", "pat_1");
    
    expect(response).toBe("Fact saved.");
    expect(mockSemanticMemory.saveFact).toHaveBeenCalled();
    expect(mockSemanticMemory.retrieveRelevantFacts).toHaveBeenCalled();
  });

  it("should return fallback on llm exception", async () => {
    mockLLMProvider.chat.mockRejectedValue(new Error("API Down"));
    const response = await orchestrator.generateResponse("conv_1", "tenant_1", "Hi");
    expect(response).toContain("dificuldades técnicas");
  });
});
