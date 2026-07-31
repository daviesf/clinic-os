import request from "supertest";
import express from "express";
import { buildPatientRoutes } from "./patientRoutes";
import { prisma } from "../../../lib/prisma";

jest.mock("../../../lib/prisma", () => ({
  prisma: {
    patient: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (cb) => cb({
      semanticMemory: { deleteMany: jest.fn() },
      episodicMemory: { deleteMany: jest.fn() },
      conversation: { findMany: jest.fn().mockResolvedValue([]) },
      message: { deleteMany: jest.fn() },
      appointment: { updateMany: jest.fn() },
      patient: {
        findUnique: jest.fn(),
        update: jest.fn(),
      }
    })),
  }
}));

const app = express();
app.use(express.json());

app.use((req: any, res, next) => {
  req.auth = { tenantId: "tenant-1", userId: "user-1", role: "user" };
  next();
});
import { PatientController } from "../controllers/PatientController";
import { PatientService } from "../../../application/services/PatientService";
import { PrismaPatientRepository } from "../../../infrastructure/persistence/PrismaRepositories";

const patientRepo = new PrismaPatientRepository(prisma as any);
const patientService = new PatientService(patientRepo);
const patientController = new PatientController(patientService);

app.use("/api/patients", buildPatientRoutes(patientController));

describe("Patient Routes E2E", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/patients/:id/anonymize should anonymize", async () => {
    (prisma.patient.findUnique as jest.Mock).mockResolvedValue({
      id: "patient-1", tenantId: "tenant-1", name: "John", phone: "123"
    });
    (prisma.patient.update as jest.Mock).mockResolvedValue({
      id: "patient-1", name: "ANONYMOUS", phone: "ANONYMOUS"
    });

    const response = await request(app).post("/api/patients/patient-1/anonymize");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
