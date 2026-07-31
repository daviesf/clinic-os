import { SocketServer } from "./SocketServer";
import { Server } from "http";

jest.mock("socket.io", () => {
  return {
    Server: jest.fn().mockImplementation(() => ({
      use: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      adapter: jest.fn()
    }))
  };
});
jest.mock("../../infrastructure/redis/client", () => ({
  redisClient: { get: jest.fn(), set: jest.fn(), duplicate: jest.fn().mockReturnThis() }
}));
jest.mock("@socket.io/redis-adapter", () => ({
  createAdapter: jest.fn()
}));

describe("SocketServer", () => {
  let server: Server;
  let socketServer: SocketServer;

  beforeEach(() => {
    server = new Server();
    socketServer = new SocketServer(server);
  });

  it("should initialize correctly", () => {
    expect(socketServer).toBeDefined();
  });
});
