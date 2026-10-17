import type { IncidentCategory, IncidentSeverity } from "../../types/incident";

export interface IncidentFormValues {
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  truck_id: string;
  location: string;
}

interface IncidentFormProps {
  values: IncidentFormValues;
  onChange: (values: IncidentFormValues) => void;
  disabled?: boolean;
}

const categories: IncidentCategory[] = [
  "Acidente com Veículo",
  "Acidente com Vítimas",
  "Condição Climática Atípica na Pista",
  "Problema Mecânico",
  "Bloqueio de Pista",
];

const severities: IncidentSeverity[] = ["Alta", "Média", "Baixa"];

export function IncidentForm({
  values,
  onChange,
  disabled = false,
}: IncidentFormProps) {
  function change<K extends keyof IncidentFormValues>(
    key: K,
    value: IncidentFormValues[K],
  ) {
    onChange({
      ...values,
      [key]: value,
    });
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm " +
    "text-slate-900 outline-none transition-colors " +
    "placeholder:text-slate-400 " +
    "focus:border-blue-600 focus:ring-2 focus:ring-blue-100 " +
    "disabled:cursor-not-allowed disabled:opacity-60 " +
    "dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 " +
    "dark:placeholder:text-slate-500 " +
    "dark:focus:border-blue-400 dark:focus:ring-blue-500/20";

  return (
    <div className="space-y-5">
      {/* Título */}
      <div>
        <label
          htmlFor="incident-title"
          className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          Título *
        </label>

        <input
          id="incident-title"
          required
          minLength={3}
          maxLength={150}
          disabled={disabled}
          value={values.title}
          onChange={(event) => change("title", event.target.value)}
          className={inputClass}
        />
      </div>

      {/* Descrição */}
      <div>
        <label
          htmlFor="incident-description"
          className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          Descrição *
        </label>

        <textarea
          id="incident-description"
          required
          minLength={5}
          maxLength={2000}
          rows={4}
          disabled={disabled}
          value={values.description}
          onChange={(event) => change("description", event.target.value)}
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Categoria e criticidade */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="incident-category"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Categoria *
          </label>

          <select
            id="incident-category"
            value={values.category}
            disabled={disabled}
            onChange={(event) =>
              change("category", event.target.value as IncidentCategory)
            }
            className={inputClass}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="incident-severity"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Criticidade *
          </label>

          <select
            id="incident-severity"
            value={values.severity}
            disabled={disabled}
            onChange={(event) =>
              change("severity", event.target.value as IncidentSeverity)
            }
            className={inputClass}
          >
            {severities.map((severity) => (
              <option key={severity} value={severity}>
                {severity}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Veículo e localização */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="incident-truck"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Identificação do veículo
          </label>

          <input
            id="incident-truck"
            maxLength={50}
            disabled={disabled}
            value={values.truck_id}
            onChange={(event) => change("truck_id", event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="incident-location"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Localização
          </label>

          <input
            id="incident-location"
            maxLength={255}
            disabled={disabled}
            value={values.location}
            onChange={(event) => change("location", event.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
