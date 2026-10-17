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
  Alta: "bg-red-100 text-red-800",
  Média: "bg-amber-100 text-amber-800",
  Baixa: "bg-slate-100 text-slate-700",
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
      <div role="status" className="p-10 text-center text-slate-500">
        Carregando incidentes...
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <Inbox className="text-slate-400" size={36} />
        <h3 className="font-semibold text-slate-800">
          Nenhum incidente encontrado
        </h3>
        <p className="text-sm text-slate-500">
          Não existem incidentes para os filtros selecionados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
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
              Ação
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {incidents.map((incident) => (
            <tr key={incident.id} className="hover:bg-slate-50">
              <td className="px-5 py-4">
                <div className="flex items-start gap-2">
                  {incident.severity === "Alta" && (
                    <AlertCircle
                      size={17}
                      className="mt-0.5 shrink-0 text-red-600"
                      aria-label="Alta criticidade"
                    />
                  )}

                  <div>
                    <p className="font-medium text-slate-900">
                      {incident.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      #{incident.id} · {incident.truck_id ?? "Sem veículo"}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-5 py-4 text-slate-600">{incident.category}</td>

              <td className="px-5 py-4">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${severityStyles[incident.severity]}`}
                >
                  {incident.severity}
                </span>
              </td>

              <td className="px-5 py-4 text-slate-700">{incident.status}</td>

              <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                {formatDate(incident.created_at)}
              </td>

              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onSelect(incident)}
                    className="flex items-center gap-1.5 font-medium text-blue-700 hover:underline"
                    title="Visualizar incidente"
                  >
                    <Eye size={15} />
                    Detalhes
                  </button>

                  <button
                    type="button"
                    disabled={editingIncidentId === incident.id}
                    onClick={() => onEdit(incident)}
                    className="flex items-center gap-1.5 font-medium text-slate-700 hover:text-blue-700 disabled:cursor-wait disabled:opacity-50"
                    title="Editar incidente"
                  >
                    <Pencil size={15} />
                    {editingIncidentId === incident.id
                      ? "Abrindo..."
                      : "Editar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(incident)}
                    className="flex items-center gap-1.5 font-medium text-red-700 hover:text-red-900"
                    title="Excluir incidente"
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
