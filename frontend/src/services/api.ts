const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let csrfToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(options?.headers);
  const method = (options?.method ?? "GET").toUpperCase();

  // Operações que alteram dados precisam do token CSRF.
  // O login é a exceção porque ainda não existe uma sessão.
  const requiresCsrf =
    !["GET", "HEAD", "OPTIONS"].includes(method) && path !== "/auth/login";

  if (requiresCsrf && csrfToken) {
    headers.set("X-CSRF-Token", csrfToken);
  }

  if (
    options?.body &&
    !(options.body instanceof FormData) &&
    !(options.body instanceof URLSearchParams) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      method,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor.");
  }

  if (!response.ok) {
    let message = "Não foi possível concluir a operação.";

    try {
      const error: unknown = await response.json();

      if (
        typeof error === "object" &&
        error !== null &&
        "detail" in error &&
        typeof error.detail === "string"
      ) {
        message = error.detail;
      }
    } catch {
      // Mantém a mensagem padrão.
    }

    // O login e a restauração da sessão tratam seus próprios erros.
    if (
      response.status === 401 &&
      path !== "/auth/login" &&
      path !== "/auth/me" &&
      path !== "/auth/logout"
    ) {
      unauthorizedHandler?.();
    }

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
