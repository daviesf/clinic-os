import { Router } from "express";
import { AnalyticsController } from "../controllers/AnalyticsController";

export function buildAnalyticsRoutes(): Router {
  const router = Router();
  const controller = new AnalyticsController();

  router.get("/dashboard", controller.getDashboardData.bind(controller));

  return router;
}
