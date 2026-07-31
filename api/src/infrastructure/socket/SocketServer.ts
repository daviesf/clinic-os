import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import { createAdapter } from "@socket.io/redis-adapter";
import { redisClient } from "../redis/client";

interface JwtPayload {
  userId: string;
  tenantId: string;
  role: string;
}

export class SocketServer {
  private io: Server;

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: "*", // Adjust in production
        methods: ["GET", "POST"],
      },
    });

    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();
    this.io.adapter(createAdapter(pubClient, subClient));

    this.setupMiddleware();
    this.setupListeners();
  }

  private setupMiddleware() {
    this.io.use((socket: Socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        socket.data.user = decoded;
        next();
      } catch (err) {
        next(new Error("Authentication error: Invalid token"));
      }
    });
  }

  private setupListeners() {
    this.io.on("connection", (socket: Socket) => {
      const tenantId = socket.data.user.tenantId;
      logger.info({ event: "socket.connected", tenantId, socketId: socket.id });

      // Join a room specifically for this tenant
      socket.join(`tenant:${tenantId}`);

      socket.on("disconnect", () => {
        logger.info({ event: "socket.disconnected", tenantId, socketId: socket.id });
      });
    });
  }

  public emitToTenant(tenantId: string, event: string, payload: any) {
    this.io.to(`tenant:${tenantId}`).emit(event, payload);
  }
}
