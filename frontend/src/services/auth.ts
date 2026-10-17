import { apiRequest } from "./api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  email: string;
  csrf_token: string;
}

export async function login(
  credentials: LoginCredentials,
): Promise<AuthSession> {
  const form = new URLSearchParams();

  form.set("username", credentials.email.trim());
  form.set("password", credentials.password);

  return apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
}

export async function getSession(): Promise<AuthSession> {
  return apiRequest<AuthSession>("/auth/me");
}

export async function logout(): Promise<void> {
  await apiRequest<{ message: string }>("/auth/logout", {
    method: "POST",
  });
}
