import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useQueryClient } from "@tanstack/react-query";

import { setAccessToken, setUnauthorizedHandler } from "../services/api";

import { login as loginRequest, type LoginCredentials } from "../services/auth";

import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    setAccessToken(null);
    setToken(null);
    setEmail(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(logout);

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [logout]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await loginRequest(credentials);

      queryClient.clear();

      setAccessToken(response.access_token);
      setToken(response.access_token);
      setEmail(credentials.email.trim().toLowerCase());
    },
    [queryClient],
  );

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      email,
      login,
      logout,
    }),
    [token, email, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
