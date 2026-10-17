import { apiRequest } from "./api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export async function login(
  credentials: LoginCredentials,
): Promise<TokenResponse> {
  const form = new URLSearchParams();

  form.set("username", credentials.email.trim());
  form.set("password", credentials.password);

  return apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
}
