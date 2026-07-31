import request from "supertest";
import express from "express";
import { buildMessageRoutes } from "./messageRoutes";

const app = express();
app.use(express.json());

// Mock controller
const mockController = {
  list: jest.fn((req, res) => res.json({ data: [] })),
  send: jest.fn((req, res) => res.json({ success: true }))
} as any;

// Mock middleware
app.use((req: any, res, next) => {
  req.auth = { tenantId: "tenant-1", userId: "user-1", role: "user" };
  next();
});
app.use("/api", buildMessageRoutes(mockController));

describe("Message Routes E2E", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /api/conversations/:id/messages should list messages", async () => {
    const response = await request(app).get("/api/conversations/conv-1/messages");
    expect(response.status).toBe(200);
    expect(mockController.list).toHaveBeenCalled();
  });

  it("POST /api/conversations/:id/messages should send message", async () => {
    const response = await request(app)
      .post("/api/conversations/conv-1/messages")
      .send({ content: "Hello" });
    expect(response.status).toBe(200);
    expect(mockController.send).toHaveBeenCalled();
  });
});
