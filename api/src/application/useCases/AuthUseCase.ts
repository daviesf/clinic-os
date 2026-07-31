import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppError } from "../../lib/errors";
import { env } from "../../config/env";
import { redisClient } from "../../infrastructure/redis/client";
import crypto from "crypto";

import { IBillingProvider } from "../interfaces/IBillingProvider";

export class AuthUseCase {
  constructor(private prisma: PrismaClient, private billingProvider?: IBillingProvider) {}

  async register(email: string, password: string, clinicName: string) {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError("Email already in use", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: clinicName }
      });
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          tenantId: tenant.id
        }
      });
      return { user, tenant };
    });

    if (this.billingProvider) {
      try {
        await this.billingProvider.createCustomer(result.tenant.id, email, clinicName);
      } catch (err) {
        console.error("Failed to create billing customer in Stripe, continuing registration:", err);
      }
    }

    return this.login(email, password);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError("Invalid credentials", 401);
    }

    const accessToken = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: "user" },
      env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const jti = crypto.randomUUID();
    const refreshToken = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, jti },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Save to redis for 7 days
    await redisClient.set(`refresh:${jti}`, "valid", "EX", 7 * 24 * 60 * 60);

    return {
      user: { id: user.id, email: user.email, tenantId: user.tenantId },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      
      const isValid = await redisClient.get(`refresh:${decoded.jti}`);
      if (!isValid) throw new AppError("Invalid or revoked refresh token", 401);

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) throw new AppError("User not found", 401);

      const accessToken = jwt.sign(
        { userId: user.id, tenantId: user.tenantId, role: "user" },
        env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      return { accessToken };
    } catch (e) {
      throw new AppError("Invalid refresh token", 401);
    }
  }

  async revokeToken(token: string) {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.jti) {
        await redisClient.del(`refresh:${decoded.jti}`);
      }
    } catch (e) {
      // ignore
    }
  }
}
