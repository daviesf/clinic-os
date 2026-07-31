import request from "supertest";
import express from "express";
import { prisma } from "../../../lib/prisma";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env";
import { buildKnowledgeBaseRoutes } from "./knowledgeBaseRoutes";
import { KnowledgeBaseController } from "../controllers/KnowledgeBaseController";

const app = express();
app.use(express.json());
app.use((req: any, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      req.auth = jwt.verify(token, env.JWT_SECRET);
    } catch(e){}
  }
  next();
});
app.use("/api/knowledge", buildKnowledgeBaseRoutes(new KnowledgeBaseController()));

describe("KnowledgeBaseRoutes E2E", () => {
  let token: string;
  let tenantId: string;

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: "Test Clinic KB" },
    });
    tenantId = tenant.id;

    const user = await prisma.user.create({
      data: {
        email: `kb-${Date.now()}@clinic.com`,
        password: "hashed",
        tenantId,
      },
    });

    token = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: "user" },
      env.JWT_SECRET
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should create a kb article", async () => {
    const res = await request(app)
      .post("/api/knowledge")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Article",
        content: "This is how we do tests.",
        type: "TEXT"
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe("Test Article");
  });

  it("should list kb articles", async () => {
    const res = await request(app)
      .get("/api/knowledge")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
