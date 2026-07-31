import { Router } from "express";
import { UserController } from "../controllers/UserController";

export function buildUserRoutes(controller: UserController): Router {
  const router = Router();

  router.get("/", controller.list.bind(controller));
  router.post("/", controller.create.bind(controller));
  router.delete("/:id", controller.delete.bind(controller));

  return router;
}
