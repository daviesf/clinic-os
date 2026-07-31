import { Request, Response, NextFunction } from "express";
import { AuthUseCase } from "../../../application/useCases/AuthUseCase";

export class AuthController {
  constructor(private authUseCase: AuthUseCase) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, clinicName } = req.body;
      if (!email || !password || !clinicName) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }
      
      const result = await this.authUseCase.register(email, password, clinicName);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authUseCase.login(email, password);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Typically we'd need cookie-parser middleware for this,
      // but let's assume it's set up or we can extract it manually.
      const cookieHeader = req.headers.cookie;
      const refreshToken = cookieHeader
        ?.split("; ")
        .find((row) => row.startsWith("refreshToken="))
        ?.split("=")[1];

      if (!refreshToken) {
        res.status(401).json({ error: "No refresh token provided" });
        return;
      }

      const result = await this.authUseCase.refreshToken(refreshToken);
      res.json({ accessToken: result.accessToken });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cookieHeader = req.headers.cookie;
      const refreshToken = cookieHeader
        ?.split("; ")
        .find((row) => row.startsWith("refreshToken="))
        ?.split("=")[1];

      if (refreshToken) {
        await this.authUseCase.revokeToken(refreshToken);
      }

      res.clearCookie("refreshToken");
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}
