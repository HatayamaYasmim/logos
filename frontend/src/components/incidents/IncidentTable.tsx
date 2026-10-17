import { AlertCircle, Eye, Inbox, Pencil, Trash2 } from "lucide-react";

import type { Incident, IncidentSeverity } from "../../types/incident";

interface IncidentTableProps {
  incidents: Incident[];
  isLoading: boolean;
  onSelect: (incident: Incident) => void;
  onEdit: (incident: Incident) => void;
  onDelete: (incident: Incident) => void;
  editingIncidentId?: number | null;
}

const severityStyles: Record<IncidentSeverity, string> = {
  Alta: "bg-red-100 text-red-800 " + "dark:bg-red-950/70 dark:text-red-300",

  Média:
    "bg-amber-100 text-amber-800 " + "dark:bg-amber-950/70 dark:text-amber-300",

  Baixa:
    "bg-slate-100 text-slate-700 " + "dark:bg-slate-700 dark:text-slate-200",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export function IncidentTable({
  incidents,
  isLoading,
  onSelect,
  onEdit,
  onDelete,
  editingIncidentId,
}: IncidentTableProps) {
  if (isLoading) {
    return (
      <div
        role="status"
        className="p-10 text-center text-slate-500 dark:text-slate-400"
      >
        Carregando incidentes...
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <Inbox size={36} className="text-slate-400 dark:text-slate-500" />

        <h3 className="font-semibold text-slate-800 dark:text-slate-100">
          Nenhum incidente encontrado
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Não existem incidentes para os filtros selecionados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <tr>
            <th scope="col" className="px-5 py-4">
              Incidente
            </th>

            <th scope="col" className="px-5 py-4">
              Categoria
            </th>

            <th scope="col" className="px-5 py-4">
              Criticidade
            </th>

            <th scope="col" className="px-5 py-4">
              Status
            </th>

            <th scope="col" className="px-5 py-4">
              Abertura
            </th>

            <th scope="col" className="px-5 py-4">
              Ações
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {incidents.map((incident) => (
            <tr
              key={incident.id}
              className="bg-white transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
            >
              {/* Incidente */}
              <td className="px-5 py-4">
                <div className="flex items-start gap-2">
                  {incident.severity === "Alta" && (
                    <AlertCircle
                      size={17}
                      className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
                      aria-label="Alta criticidade"
                    />
                  )}

                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {incident.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      #{incident.id} · {incident.truck_id ?? "Sem veículo"}
                    </p>
                  </div>
                </div>
              </td>

              {/* Categoria */}
              <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                {incident.category}
              </td>

              {/* Criticidade */}
              <td className="px-5 py-4">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${severityStyles[incident.severity]}`}
                >
                  {incident.severity}
                </span>
              </td>

              {/* Status */}
              <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                {incident.status}
              </td>

              {/* Data de abertura */}
              <td className="whitespace-nowrap px-5 py-4 text-slate-500 dark:text-slate-400">
                {formatDate(incident.created_at)}
              </td>

              {/* Ações */}
              <td className="px-5 py-4">
                <div className="flex items-center gap-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onSelect(incident)}
                    className="flex items-center gap-1.5 font-medium text-blue-700 transition-colors hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                    title="Visualizar incidente"
                    aria-label={`Visualizar detalhes do incidente ${incident.id}`}
                  >
                    <Eye size={15} />
                    Detalhes
                  </button>

                  <button
                    type="button"
                    disabled={editingIncidentId === incident.id}
                    onClick={() => onEdit(incident)}
                    className="flex items-center gap-1.5 font-medium text-slate-700 transition-colors hover:text-blue-700 disabled:cursor-wait disabled:opacity-50 dark:text-slate-300 dark:hover:text-blue-400"
                    title="Editar incidente"
                    aria-label={`Editar incidente ${incident.id}`}
                  >
                    <Pencil size={15} />

                    {editingIncidentId === incident.id
                      ? "Abrindo..."
                      : "Editar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(incident)}
                    className="flex items-center gap-1.5 font-medium text-red-700 transition-colors hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    title="Excluir incidente"
                    aria-label={`Excluir incidente ${incident.id}`}
                  >
                    <Trash2 size={15} />
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
