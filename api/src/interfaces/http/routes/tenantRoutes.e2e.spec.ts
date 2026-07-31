import request from "supertest";
import express from "express";
import { buildTenantRoutes } from "./tenantRoutes";
import { prisma } from "../../../lib/prisma";

jest.mock("../../../lib/prisma", () => ({
  prisma: {
    tenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  }
}));

const app = express();
app.use(express.json());

app.use((req: any, res, next) => {
  req.auth = { tenantId: "tenant-1", userId: "user-1", role: "user" };
  next();
});
app.use("/api/tenants", buildTenantRoutes());

describe("Tenant Routes E2E", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /api/tenants/settings should fetch settings", async () => {
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
      id: "tenant-1", name: "Clinic", specialty: "General"
    });

    const response = await request(app).get("/api/tenants/settings");
    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe("Clinic");
  });

  it("PATCH /api/tenants/settings should update settings", async () => {
    (prisma.tenant.update as jest.Mock).mockResolvedValue({
      id: "tenant-1", name: "New Clinic"
    });

    const response = await request(app)
      .patch("/api/tenants/settings")
      .send({ name: "New Clinic" });
    
    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe("New Clinic");
  });
});
