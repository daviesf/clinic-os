import { create } from "zustand";

interface User {
  id: string;
  email: string;
  tenantId: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("clinicos_token") || null,
  user: null, // Depending on complexity, we might store user in localStorage or refetch
  setAuth: (token, user) => {
    localStorage.setItem("clinicos_token", token);
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("clinicos_token");
    set({ token: null, user: null });
  },
}));
