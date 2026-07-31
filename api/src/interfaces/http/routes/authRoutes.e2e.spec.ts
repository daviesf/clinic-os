import request from "supertest";
import express from "express";
import { buildAuthRoutes } from "./authRoutes";
import { PrismaClient } from "@prisma/client";
import { redisClient } from "../../../infrastructure/redis/client";
import bcrypt from "bcrypt";

// Mock prisma and redis
jest.mock("../../../lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  }
}));
import { prisma } from "../../../lib/prisma";

jest.mock("../../../infrastructure/redis/client", () => ({
  redisClient: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    pexpire: jest.fn().mockResolvedValue(1),
  }
}));

jest.mock("../../../infrastructure/billing/StripeBillingProvider", () => {
  return {
    StripeBillingProvider: jest.fn().mockImplementation(() => {
      return {
        createCustomer: jest.fn().mockResolvedValue("cus_test"),
        createSubscription: jest.fn().mockResolvedValue({ subscriptionId: "sub_test" }),
        cancelSubscription: jest.fn().mockResolvedValue(true),
        getPlans: jest.fn().mockResolvedValue([])
      };
    })
  };
});

const app = express();
app.use(express.json());
app.use("/api/auth", buildAuthRoutes());

describe("Auth Routes E2E", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/auth/register should create a tenant and a user", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return {
        user: { id: "user-1", email: "test@example.com", tenantId: "tenant-1" },
        tenant: { id: "tenant-1", name: "Test Clinic" }
      };
    });
    // For the login call inside register
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: "user-1",
      email: "test@example.com",
      password: await bcrypt.hash("password123", 10),
      tenantId: "tenant-1"
    });

    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@example.com", password: "password123", clinicName: "Test Clinic" });

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toBeDefined();
    expect(response.headers["set-cookie"]).toBeDefined();
  });
});
