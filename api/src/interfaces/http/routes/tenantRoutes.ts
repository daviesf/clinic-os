import { Router } from "express";
import { TenantController } from "../controllers/TenantController";

export function buildTenantRoutes(): Router {
  const router = Router();
  const controller = new TenantController();

  router.get("/settings", controller.getSettings);
  router.patch("/settings", controller.updateSettings);

  return router;
}
