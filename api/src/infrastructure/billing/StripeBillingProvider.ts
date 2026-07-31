import { IBillingProvider, SubscriptionPlan } from "../../application/interfaces/IBillingProvider";
import Stripe from "stripe";
import { logger } from "../../lib/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_fake", {
  apiVersion: "2025-02-24.acacia" as any,
});

export class StripeBillingProvider implements IBillingProvider {
  private plans: SubscriptionPlan[] = [
    { id: "price_basic_123", name: "Basic", price: 99.00, currency: "BRL", features: ["100 conversations/mo"] },
    { id: "price_pro_456", name: "Pro", price: 299.00, currency: "BRL", features: ["Unlimited conversations"] }
  ];

  async createCustomer(tenantId: string, email: string, name: string): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { tenantId }
      });
      return customer.id;
    } catch (error) {
      logger.error({ event: "stripe.create_customer_failed", error });
      throw new Error("Failed to create billing customer");
    }
  }

  async createSubscription(customerId: string, planId: string): Promise<{ subscriptionId: string, checkoutUrl?: string }> {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: planId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.FRONTEND_URL}/dashboard?checkout=success`,
        cancel_url: `${process.env.FRONTEND_URL}/dashboard?checkout=canceled`,
      });

      return {
        subscriptionId: "pending",
        checkoutUrl: session.url || undefined,
      };
    } catch (error) {
      logger.error({ event: "stripe.create_subscription_failed", error });
      throw new Error("Failed to create billing subscription");
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      if (subscriptionId === "pending" || subscriptionId.includes("fake")) return true;
      await stripe.subscriptions.cancel(subscriptionId);
      return true;
    } catch (error) {
      logger.error({ event: "stripe.cancel_subscription_failed", error });
      return false;
    }
  }

  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.plans;
  }
}
