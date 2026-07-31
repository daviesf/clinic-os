import { StripeBillingProvider } from "./StripeBillingProvider";

// Mock stripe module before importing StripeBillingProvider
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: "cus_123" })
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: "http://checkout.stripe.com/123" })
      }
    },
    subscriptions: {
      cancel: jest.fn().mockResolvedValue({ id: "sub_123", status: "canceled" })
    }
  }));
});

import Stripe from "stripe";

describe("StripeBillingProvider", () => {
  let provider: StripeBillingProvider;
  let stripeMock: any;

  beforeEach(() => {
    provider = new StripeBillingProvider();
    stripeMock = new Stripe("test", { apiVersion: "2025-02-24.acacia" as any });
  });

  it("should create customer", async () => {
    const customerId = await provider.createCustomer("tenant_1", "test@test.com", "Test Clinic");
    expect(customerId).toBe("cus_123");
  });

  it("should create subscription session", async () => {
    const result = await provider.createSubscription("cus_123", "price_123");
    expect(result.subscriptionId).toBe("pending");
    expect(result.checkoutUrl).toBe("http://checkout.stripe.com/123");
  });

  it("should cancel subscription", async () => {
    const result = await provider.cancelSubscription("sub_123");
    expect(result).toBe(true);
  });

  it("should get plans", async () => {
    const plans = await provider.getPlans();
    expect(plans.length).toBeGreaterThan(0);
    expect(plans[0]).toHaveProperty("price");
  });
});
