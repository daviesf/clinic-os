import { SocketServer } from "./SocketServer";
import { Emitter } from "@socket.io/redis-emitter";
import { redisClient } from "../redis/client";

let socketServerInstance: SocketServer | null = null;
const redisClientDup = redisClient.duplicate();
const redisEmitter = new Emitter(redisClientDup);

export const setSocketServer = (server: SocketServer) => {
  socketServerInstance = server;
};

export const emitToTenant = (tenantId: string, event: string, payload: any) => {
  if (socketServerInstance) {
    socketServerInstance.emitToTenant(tenantId, event, payload);
  } else {
    // We are in a worker process, use redis-emitter
    redisEmitter.to(`tenant:${tenantId}`).emit(event, payload);
  }
};
