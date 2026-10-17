import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useQueryClient } from "@tanstack/react-query";

import { setCsrfToken, setUnauthorizedHandler } from "../services/api";

import {
  getSession,
  login as loginRequest,
  logout as logoutRequest,
  type LoginCredentials,
} from "../services/auth";

import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setCsrfToken(null);
    setEmail(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    let cancelled = false;

    setUnauthorizedHandler(clearSession);

    async function restoreSession() {
      try {
        const session = await getSession();

        if (cancelled) return;

        setCsrfToken(session.csrf_token);
        setEmail(session.email);
      } catch {
        if (cancelled) return;

        clearSession();
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
      setUnauthorizedHandler(null);
    };
  }, [clearSession]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const session = await loginRequest(credentials);

      queryClient.clear();

      setCsrfToken(session.csrf_token);
      setEmail(session.email);
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    // A requisição começa enquanto o token CSRF ainda está disponível.
    void logoutRequest().catch(() => {
      // Falhas de rede não impedem a limpeza da interface.
    });

    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      isAuthenticated: email !== null,
      isLoading,
      email,
      login,
      logout,
    }),
    [email, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
