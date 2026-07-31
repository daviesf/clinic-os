import { Router } from "express";
import { PatientController } from "../controllers/PatientController";

export function buildPatientRoutes(controller: PatientController): Router {
  const router = Router();

  router.get("/", controller.list.bind(controller));
  router.get("/:patientId", controller.get.bind(controller));
  router.get("/:patientId/360", controller.get360.bind(controller));
  router.post("/", controller.create.bind(controller));
  router.put("/:patientId", controller.update.bind(controller));
  router.post("/:patientId/anonymize", controller.anonymize.bind(controller));

  return router;
}
