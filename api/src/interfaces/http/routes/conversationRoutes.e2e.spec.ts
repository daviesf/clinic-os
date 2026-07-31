import request from "supertest";
import express from "express";
import { buildConversationRoutes } from "./conversationRoutes";

const app = express();
app.use(express.json());

// Mock controller
const mockController = {
  list: jest.fn((req, res) => res.json({ data: [] })),
  takeOver: jest.fn((req, res) => res.json({ success: true })),
  release: jest.fn((req, res) => res.json({ success: true }))
} as any;

// Mock middleware
app.use((req: any, res, next) => {
  req.auth = { tenantId: "tenant-1", userId: "user-1", role: "user" };
  next();
});
app.use("/api/conversations", buildConversationRoutes(mockController));

describe("Conversation Routes E2E", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /api/conversations should list conversations", async () => {
    const response = await request(app).get("/api/conversations");
    expect(response.status).toBe(200);
    expect(mockController.list).toHaveBeenCalled();
  });

  it("POST /api/conversations/:id/take-over should take over", async () => {
    const response = await request(app).post("/api/conversations/conv-1/take-over");
    expect(response.status).toBe(200);
    expect(mockController.takeOver).toHaveBeenCalled();
  });
});
