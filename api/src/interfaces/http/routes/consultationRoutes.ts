import { Router } from "express";
import multer from "multer";
import { ConsultationController } from "../controllers/ConsultationController";

const upload = multer({ storage: multer.memoryStorage() });

export function buildConsultationRoutes(controller: ConsultationController): Router {
  const router = Router();

  router.post("/transcribe", upload.single("audio"), controller.transcribe);

  return router;
}
