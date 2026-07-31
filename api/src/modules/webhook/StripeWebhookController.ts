import { Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { env } from "../../config/env";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_fake", {
  apiVersion: "2025-02-24.acacia" as any,
});

export class StripeWebhookController {
  async handle(req: Request, res: Response) {
    const sig = req.headers["stripe-signature"];
    let event: Stripe.Event;

    try {
      if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error("Missing signature or secret");
      }
      
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody || req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      logger.error({ event: "stripe.webhook_signature_failed", error: err.message });
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.customer) {
            await prisma.tenant.updateMany({
              where: { stripeCustomerId: session.customer.toString() },
              data: { subscriptionStatus: "active" }
            });
          }
          logger.info({ event: "stripe.checkout_completed", session: session.id });
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.customer) {
            await prisma.tenant.updateMany({
              where: { stripeCustomerId: invoice.customer.toString() },
              data: { subscriptionStatus: "past_due" }
            });
          }
          logger.info({ event: "stripe.payment_failed", customer: invoice.customer });
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          if (subscription.customer) {
            await prisma.tenant.updateMany({
              where: { stripeCustomerId: subscription.customer.toString() },
              data: { subscriptionStatus: "canceled" }
            });
          }
          logger.info({ event: "stripe.subscription_canceled", subscription: subscription.id });
          break;
        }
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          if (subscription.customer) {
            await prisma.tenant.updateMany({
              where: { stripeCustomerId: subscription.customer.toString() },
              data: { subscriptionStatus: subscription.status === "active" ? "active" : "past_due" }
            });
          }
          break;
        }
        default:
          logger.info({ event: "stripe.unhandled_event", type: event.type });
      }

      res.json({ received: true });
    } catch (error) {
      logger.error({ event: "stripe.webhook_process_failed", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
