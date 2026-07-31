import request from "supertest";
import express from "express";
import { buildAppointmentRoutes } from "./appointmentRoutes";
import { prisma } from "../../../lib/prisma";

// Mock prisma
jest.mock("../../../lib/prisma", () => ({
  prisma: {
    appointment: {
      findMany: jest.fn(),
    },
  }
}));

const app = express();
app.use(express.json());

// Mock middleware to simulate authenticated user
app.use((req: any, res, next) => {
  req.auth = { tenantId: "tenant-1", userId: "user-1", role: "user" };
  next();
});
app.use("/api/appointments", buildAppointmentRoutes());

describe("Appointment Routes E2E", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /api/appointments should list appointments for the tenant", async () => {
    (prisma.appointment.findMany as jest.Mock).mockResolvedValue([
      { id: "app-1", tenantId: "tenant-1", patientName: "John", phone: "123", date: new Date() }
    ]);

    const response = await request(app).get("/api/appointments");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].patientName).toBe("John");
  });
});
