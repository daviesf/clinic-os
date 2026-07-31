import { Request, Response } from "express";
import { AuthContext } from "../types";
import { logger } from "../../../lib/logger";
import { PatientService } from "../../../application/services/PatientService";
import { AuditService } from "../../../application/services/AuditService";

export class PatientController {
  constructor(private patientService: PatientService) {}

  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const { search, skip, take } = req.query;
      
      const result = await this.patientService.findAll(tenantId, {
        search: search as string,
        skip: skip ? parseInt(skip as string) : undefined,
        take: take ? parseInt(take as string) : 50,
      });

      res.status(200).json({ data: result.data, total: result.total });
    } catch (error) {
      logger.error({ event: "controller.patient.list.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const patientId = req.params.patientId as string;
      const patient = await this.patientService.findById(tenantId, patientId);
      if (!patient) {
        res.status(404).json({ error: "Patient not found" });
        return;
      }
      res.status(200).json({ data: patient });
    } catch (error) {
      logger.error({ event: "controller.patient.get.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async get360(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const patientId = req.params.patientId as string;
      
      const patient360 = await this.patientService.getPatient360(tenantId, patientId);
      
      if (!patient360) {
        res.status(404).json({ error: "Patient not found" });
        return;
      }
      
      res.status(200).json({ data: patient360 });
    } catch (error) {
      logger.error({ event: "controller.patient.get360.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = (req as Request & { auth: AuthContext }).auth;
      const patient = await this.patientService.create({ ...req.body, tenantId });
      
      await AuditService.log(tenantId, "CREATE_PATIENT", "Patient", userId, { patientId: patient.id });
      res.status(201).json({ data: patient });
    } catch (error) {
      logger.error({ event: "controller.patient.create.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = (req as Request & { auth: AuthContext }).auth;
      const patientId = req.params.patientId as string;
      
      const patient = await this.patientService.update(tenantId, patientId, req.body);
      
      await AuditService.log(tenantId, "UPDATE_PATIENT", "Patient", userId, { patientId });
      res.status(200).json({ data: patient });
    } catch (error) {
      logger.error({ event: "controller.patient.update.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async anonymize(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = (req as Request & { auth: AuthContext }).auth;
      const patientId = req.params.patientId as string;

      await this.patientService.anonymizePatient(tenantId, patientId);
      
      await AuditService.log(tenantId, "ANONYMIZE_PATIENT", "Patient", userId, { patientId });

      res.status(200).json({ success: true, message: "Paciente anonimizado com sucesso." });
    } catch (error) {
      logger.error({ event: "controller.patient.anonymize.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
