import { AuthUseCase } from "./AuthUseCase";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { redisClient } from "../../infrastructure/redis/client";

jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../../infrastructure/redis/client", () => ({
  redisClient: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  }
}));

describe("AuthUseCase", () => {
  let authUseCase: AuthUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn()
      }
    };
    authUseCase = new AuthUseCase(mockPrisma, {
      createCustomer: jest.fn().mockResolvedValue("cus_123"),
      createSubscription: jest.fn().mockResolvedValue({ subscriptionId: "sub_123" }),
      cancelSubscription: jest.fn().mockResolvedValue(true),
      getPlans: jest.fn().mockResolvedValue([])
    } as any);
    process.env.JWT_SECRET = "test-secret";
  });

  it("should authenticate valid user and return tokens", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@clinic.com",
      password: "hashed-password",
      tenantId: "tenant-1"
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue("fake-token");

    const result = await authUseCase.login("test@clinic.com", "password123");

    expect(result).toHaveProperty("accessToken", "fake-token");
    expect(result).toHaveProperty("refreshToken", "fake-token");
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "test@clinic.com" }, include: { tenant: true } });
    expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashed-password");
  });

  it("should throw error for invalid credentials", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(authUseCase.login("wrong@clinic.com", "password123")).rejects.toThrow("Invalid credentials");
  });

  it("should register a new user and tenant", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction = jest.fn().mockImplementation(async (cb) => {
      return cb({
        tenant: { create: jest.fn().mockResolvedValue({ id: "tenant-1" }) },
        user: { create: jest.fn().mockResolvedValue({ id: "user-1", email: "new@clinic.com", tenantId: "tenant-1" }) }
      });
    });
    
    // mock login internally called
    jest.spyOn(authUseCase, "login").mockResolvedValue({
      user: { id: "user-1", email: "new@clinic.com", tenantId: "tenant-1" },
      accessToken: "token",
      refreshToken: "refresh",
    });

    const result = await authUseCase.register("new@clinic.com", "password123", "New Clinic");
    expect(result.accessToken).toBe("token");
    expect(mockPrisma.user.findUnique).toHaveBeenCalled();
  });

  it("should throw error if email already in use during register", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1" });
    await expect(authUseCase.register("new@clinic.com", "password", "Clinic")).rejects.toThrow("Email already in use");
  });

  it("should refresh token successfully", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ jti: "123", userId: "user-1" });
    const { redisClient } = require("../../infrastructure/redis/client");
    redisClient.get.mockResolvedValue("valid");
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1", tenantId: "tenant-1" });
    (jwt.sign as jest.Mock).mockReturnValue("new-access-token");

    const result = await authUseCase.refreshToken("old-refresh-token");
    expect(result.accessToken).toBe("new-access-token");
  });

  it("should throw error on invalid refresh token", async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error("Invalid"); });
    await expect(authUseCase.refreshToken("invalid")).rejects.toThrow("Invalid refresh token");
  });

  it("should revoke token successfully", async () => {
    (jwt.decode as jest.Mock).mockReturnValue({ jti: "123" });
    const { redisClient } = require("../../infrastructure/redis/client");
    
    await authUseCase.revokeToken("some-token");
    expect(redisClient.del).toHaveBeenCalledWith("refresh:123");
  });
});
