import { Router } from "express";
import { AutomationController } from "../controllers/AutomationController";

export function buildAutomationRoutes(controller: AutomationController): Router {
  const router = Router();

  router.get("/", controller.list.bind(controller));
  router.post("/", controller.create.bind(controller));
  router.delete("/:id", controller.delete.bind(controller));

  return router;
}
