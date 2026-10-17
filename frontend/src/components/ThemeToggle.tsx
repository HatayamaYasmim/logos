import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/theme-context";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-1.5 text-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}

      {theme === "dark" ? "Claro" : "Escuro"}
    </button>
  );
}
