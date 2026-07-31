import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { jwtAuth } from "./jwtAuth";
import { asyncLocalStorage } from "../../../lib/requestContext";

jest.mock("jsonwebtoken");

describe("jwtAuth Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    process.env.JWT_SECRET = "test-secret";
  });

  it("should return 401 if no authorization header is provided", () => {
    jwtAuth(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing or invalid Authorization header" });
  });

  it("should return 401 if token is invalid", () => {
    req.headers!.authorization = "Bearer invalid-token";
    (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error("Invalid"); });

    jwtAuth(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired token" });
  });

  it("should set tenantId in context and call next if token is valid", async () => {
    req.headers!.authorization = "Bearer valid-token";
    (jwt.verify as jest.Mock).mockReturnValue({ tenantId: "tenant-1", userId: "user-1", role: "user" });
    
    // Test that the asyncLocalStorage correctly runs the callback
    const alsRunSpy = jest.spyOn(asyncLocalStorage, "run").mockImplementation((store: any, callback: any) => {
      callback();
    });

    jwtAuth(req as Request, res as Response, next);

    // Wait for the dynamic import microtask to finish
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(alsRunSpy).toHaveBeenCalledWith(expect.objectContaining({ tenantId: "tenant-1" }), expect.any(Function));
    expect(next).toHaveBeenCalled();
  });
});
