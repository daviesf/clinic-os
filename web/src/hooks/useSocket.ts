import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/useAuthStore";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function useSocket() {
  const { token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocketInstance(null);
        setIsConnected(false);
      }
      return;
    }

    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
      });
      setSocketInstance(socketRef.current);

      socketRef.current.on("connect", () => {
        setIsConnected(true);
      });

      socketRef.current.on("disconnect", () => {
        setIsConnected(false);
      });
    }

    return () => {};
  }, [token]);

  return { socket: socketInstance, isConnected };
}
