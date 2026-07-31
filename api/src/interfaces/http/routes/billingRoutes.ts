import { Router } from "express";
import { BillingController } from "../controllers/BillingController";

export function buildBillingRoutes(controller: BillingController): Router {
  const router = Router();

  router.get("/portal", controller.getPortalUrl.bind(controller));
  router.post("/checkout", controller.getCheckoutUrl.bind(controller));
  router.get("/status", controller.getStatus.bind(controller));

  return router;
}
