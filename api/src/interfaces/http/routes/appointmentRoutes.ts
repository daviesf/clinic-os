import { Router } from "express";
import { AppointmentController } from "../controllers/AppointmentController";

export function buildAppointmentRoutes(): Router {
  const router = Router();
  const controller = new AppointmentController();

  router.get("/", controller.list);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.delete);

  return router;
}
