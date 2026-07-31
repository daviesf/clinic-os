import { StripeWebhookController } from "./StripeWebhookController";
import Stripe from "stripe";
import { Request, Response } from "express";

const mockConstructEvent = jest.fn();

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: (...args: any[]) => mockConstructEvent(...args)
    }
  }));
});


describe("StripeWebhookController", () => {
  let controller: StripeWebhookController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let stripeMock: any;

  beforeEach(() => {
    controller = new StripeWebhookController();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    
    mockReq = {
      headers: {
        "stripe-signature": "test-signature"
      },
      body: "raw-body",
    } as any;
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
    
    const StripeConstructor = require("stripe");
    stripeMock = new StripeConstructor();
  });

  it("should handle checkout.session.completed", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "sess_123" } }
    });

    await controller.handle(mockReq as Request, mockRes as Response);

    expect(mockConstructEvent).toHaveBeenCalledWith(
      "raw-body",
      "test-signature",
      "whsec_test"
    );
    expect(mockRes.json).toHaveBeenCalledWith({ received: true });
  });

  it("should reject invalid signature", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    await controller.handle(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith("Webhook Error: Invalid signature");
  });
});
