import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  LockKeyhole,
  LogIn,
  Mail,
  TruckElectric,
} from "lucide-react";

import { useAuth } from "../contexts/auth-context";
import { ApiError } from "../services/api";
import { ThemeToggle } from "../components/ThemeToggle";
import { ParticleWaveBackground } from "../components/ParticleWaveBackground";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("E-mail ou senha incorretos.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Ocorreu um erro inesperado.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white " +
    "py-2 pl-10 pr-3 text-sm text-slate-900 outline-none " +
    "placeholder:text-slate-400 transition-colors " +
    "focus:border-blue-600 focus:ring-2 focus:ring-blue-100 " +
    "disabled:opacity-60 " +
    "dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 " +
    "dark:placeholder:text-slate-500 " +
    "dark:focus:border-blue-400 dark:focus:ring-blue-500/20";

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-10 transition-colors dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <ParticleWaveBackground />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 hidden bg-gradient-to-b from-slate-950/10 via-slate-950/20 to-slate-950/70 dark:block"
      />

      <div className="absolute right-4 top-4 z-20 sm:right-8 sm:top-6">
        <ThemeToggle />
      </div>

      <main className="w-full max-w-md">
        {/* Cartão de autenticação */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl transition-colors dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/30">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg dark:bg-blue-600">
              <TruckElectric size={50} strokeWidth={1.25} />
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Logos
            </h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Central de Resposta a Incidentes
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* E-mail */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                E-mail
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  disabled={isSubmitting}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="analista@logos.local"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Senha
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                />

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Erro de autenticação */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Entrar */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <LogIn size={18} />
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        {/* Rodapé */}
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Acesso restrito aos analistas autorizados.
        </p>
      </main>
    </div>
  );
}
