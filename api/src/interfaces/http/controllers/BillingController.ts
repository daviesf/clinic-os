import { Request, Response } from "express";
import { AuthContext } from "../types";
import { prisma } from "../../../lib/prisma";
import { logger } from "../../../lib/logger";
import { StripeBillingProvider } from "../../../infrastructure/billing/StripeBillingProvider";
import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeKey 
  ? new Stripe(stripeKey, { apiVersion: "2025-02-24.acacia" as any })
  : null;

export class BillingController {
  private billingProvider: StripeBillingProvider;

  constructor() {
    this.billingProvider = new StripeBillingProvider();
  }

  async getPortalUrl(req: Request, res: Response): Promise<void> {
    try {
      if (!stripe) {
        res.status(400).json({ error: "Stripe não configurado. Defina STRIPE_SECRET_KEY no .env" });
        return;
      }
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      if (!tenant.stripeCustomerId) {
        res.status(400).json({ error: "Customer hasn't set up billing yet" });
        return;
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: tenant.stripeCustomerId,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing`,
      });

      res.status(200).json({ url: session.url });
    } catch (error) {
      logger.error({ event: "controller.billing.getPortalUrl.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getCheckoutUrl(req: Request, res: Response): Promise<void> {
    try {
      if (!stripe) {
        res.status(400).json({ error: "Stripe não configurado. Defina STRIPE_SECRET_KEY no .env" });
        return;
      }
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const { planId } = req.body;

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      let customerId = tenant.stripeCustomerId;

      if (!customerId) {
        const firstUser = await prisma.user.findFirst({ where: { tenantId } });
        customerId = await this.billingProvider.createCustomer(tenantId, firstUser?.email || "admin@clinic.os", tenant.name);
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { stripeCustomerId: customerId }
        });
      }

      const { checkoutUrl } = await this.billingProvider.createSubscription(customerId, planId);

      res.status(200).json({ url: checkoutUrl });
    } catch (error) {
      logger.error({ event: "controller.billing.getCheckoutUrl.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { subscriptionStatus: true }
      });
      
      const patientsCount = await prisma.patient.count({ where: { tenantId } });
      const messagesCount = await prisma.message.count({ 
        where: { 
          conversation: { tenantId }, 
          direction: "OUTBOUND" 
        } 
      });

      res.status(200).json({ 
        data: { 
          status: tenant?.subscriptionStatus || "inactive",
          metrics: {
            patients: patientsCount,
            messages: messagesCount
          }
        } 
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
