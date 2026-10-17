import { createContext, useContext } from "react";

import type { LoginCredentials } from "../services/auth";

export interface AuthContextType {
  isAuthenticated: boolean;
  email: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de AuthProvider.");
  }

  return context;
}
