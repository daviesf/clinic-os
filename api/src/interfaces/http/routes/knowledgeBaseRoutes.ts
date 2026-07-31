import { Router } from "express";
import { KnowledgeBaseController } from "../controllers/KnowledgeBaseController";

export function buildKnowledgeBaseRoutes(controller: KnowledgeBaseController): Router {
  const router = Router();

  router.get("/", controller.list.bind(controller));
  router.post("/", controller.create.bind(controller));
  router.get("/:id", controller.get.bind(controller));
  router.delete("/:id", controller.delete.bind(controller));

  return router;
}
