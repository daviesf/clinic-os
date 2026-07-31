export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
}

export interface IBillingProvider {
  createCustomer(tenantId: string, email: string, name: string): Promise<string>;
  createSubscription(customerId: string, planId: string): Promise<{ subscriptionId: string, checkoutUrl?: string }>;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
  getPlans(): Promise<SubscriptionPlan[]>;
}
