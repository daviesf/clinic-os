import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import { ConversationController } from "../controllers/ConversationController";
import { MessageController } from "../controllers/MessageController";
import { buildConversationRoutes } from "./conversationRoutes";
import { buildMessageRoutes } from "./messageRoutes";

import { buildAuthRoutes } from "./authRoutes";
import { buildTenantRoutes } from "./tenantRoutes";
import { buildAppointmentRoutes } from "./appointmentRoutes";
import { buildPatientRoutes } from "./patientRoutes";
import { buildAnalyticsRoutes } from "./analyticsRoutes";

import { buildKnowledgeBaseRoutes } from "./knowledgeBaseRoutes";
import { buildAutomationRoutes } from "./automationRoutes";
import { buildUserRoutes } from "./userRoutes";
import { buildBillingRoutes } from "./billingRoutes";
import { buildTaskRoutes } from "./taskRoutes";
import { buildConsultationRoutes } from "./consultationRoutes";

export function buildApiRoutes(
  conversationController: ConversationController,
  messageController: MessageController,
  patientController: import("../controllers/PatientController").PatientController,
  knowledgeBaseController: import("../controllers/KnowledgeBaseController").KnowledgeBaseController,
  automationController: import("../controllers/AutomationController").AutomationController,
  userController: import("../controllers/UserController").UserController,
  billingController: import("../controllers/BillingController").BillingController,
  taskController: import("../controllers/TaskController").TaskController,
  consultationController: import("../controllers/ConsultationController").ConsultationController
): Router {
  const router = Router();

  // Public routes
  router.use("/auth", buildAuthRoutes());

  // All other API routes require JWT authentication
  router.use(jwtAuth);

  // Mount sub-routes
  router.use("/conversations", buildConversationRoutes(conversationController));
  router.use("/", buildMessageRoutes(messageController));
  router.use("/tenant", buildTenantRoutes());
  router.use("/appointments", buildAppointmentRoutes());
  router.use("/patients", buildPatientRoutes(patientController));
  router.use("/analytics", buildAnalyticsRoutes());
  router.use("/knowledge", buildKnowledgeBaseRoutes(knowledgeBaseController));
  router.use("/automations", buildAutomationRoutes(automationController));
  router.use("/users", buildUserRoutes(userController));
  router.use("/billing", buildBillingRoutes(billingController));
  router.use("/tasks", buildTaskRoutes(taskController));
  router.use("/consultations", buildConsultationRoutes(consultationController));

  return router;
}
