import request from "supertest";
import express from "express";
import { prisma } from "../../../lib/prisma";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env";
import { buildAutomationRoutes } from "./automationRoutes";
import { AutomationController } from "../controllers/AutomationController";

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
app.use("/api/automations", buildAutomationRoutes(new AutomationController()));

describe("AutomationRoutes E2E", () => {
  let token: string;
  let tenantId: string;
  let patientId: string;

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: "Test Clinic Automation" },
    });
    tenantId = tenant.id;

    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@clinic.com`,
        password: "hashed",
        tenantId,
      },
    });

    token = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: "user" },
      env.JWT_SECRET
    );

    const patient = await prisma.patient.create({
      data: {
        tenantId,
        phone: "5511999999999",
        name: "Test Patient"
      }
    });
    patientId = patient.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should create a followup", async () => {
    const res = await request(app)
      .post("/api/automations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patientId,
        triggerAt: new Date(Date.now() + 86400000).toISOString(),
        intent: "Test automation"
      });

    expect(res.status).toBe(201);
    expect(res.body.data.intent).toBe("Test automation");
  });

  it("should list followups", async () => {
    const res = await request(app)
      .get("/api/automations")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
