import { Request, Response } from "express";
import { AuthContext } from "../types";
import { prisma } from "../../../lib/prisma";
import { logger } from "../../../lib/logger";
import bcrypt from "bcrypt";

export class UserController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const users = await prisma.user.findMany({
        where: { tenantId },
        select: { id: true, email: true, createdAt: true }
      });
      res.status(200).json({ data: users });
    } catch (error) {
      logger.error({ event: "controller.user.list.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const { email, password } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(400).json({ error: "Email já em uso" });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          tenantId
        },
        select: { id: true, email: true, createdAt: true }
      });

      res.status(201).json({ data: user });
    } catch (error) {
      logger.error({ event: "controller.user.create.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = (req as Request & { auth: AuthContext }).auth;
      const id = req.params.id as string;

      if (id === userId) {
        res.status(400).json({ error: "Não é possível excluir a si mesmo" });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user || user.tenantId !== tenantId) {
        res.status(404).json({ error: "Usuário não encontrado" });
        return;
      }

      await prisma.user.delete({ where: { id } });
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error({ event: "controller.user.delete.error", error });
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
