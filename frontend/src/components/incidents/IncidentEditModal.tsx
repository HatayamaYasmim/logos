import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "../../services/api";
import {
  getIncident,
  updateIncident,
  updateIncidentStatus,
} from "../../services/incidents";

import type {
  Incident,
  IncidentStatus,
  UpdateIncidentPayload,
} from "../../types/incident";
import { IncidentForm, type IncidentFormValues } from "./IncidentForm";

interface IncidentEditModalProps {
  incident: Incident;
  onClose: () => void;
  onUpdated: () => void;
}

const statuses: IncidentStatus[] = [
  "Aberto",
  "Em Investigação",
  "Fechado",
  "Inconclusivo",
];

function toFormValues(incident: Incident): IncidentFormValues {
  return {
    title: incident.title,
    description: incident.description,
    category: incident.category,
    severity: incident.severity,
    truck_id: incident.truck_id ?? "",
    location: incident.location ?? "",
  };
}

export function IncidentEditModal({
  incident,
  onClose,
  onUpdated,
}: IncidentEditModalProps) {
  const queryClient = useQueryClient();

  const [values, setValues] = useState<IncidentFormValues>(() =>
    toFormValues(incident),
  );

  const [version, setVersion] = useState(incident.version);
  const [conflict, setConflict] = useState(false);
  const [reloadError, setReloadError] = useState("");
  const [reloading, setReloading] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus>(
    incident.status,
  );

  const [currentStatus, setCurrentStatus] = useState<IncidentStatus>(
    incident.status,
  );

  async function refreshQueries() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["incidents"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["incident-stats"],
      }),
    ]);
  }

  // Atualiza os dados gerais do incidente.
  const mutation = useMutation({
    mutationFn: (payload: UpdateIncidentPayload) =>
      updateIncident(incident.id, payload),

    onSuccess: async () => {
      toast.success("Incidente atualizado com sucesso!");

      await refreshQueries();
      onUpdated();
    },

    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setConflict(true);
      }
    },
  });

  // Atualiza somente o status do incidente.
  const statusMutation = useMutation({
    mutationFn: (data: { status: IncidentStatus; version: number }) =>
      updateIncidentStatus(incident.id, data.status, data.version),

    onSuccess: async (updated) => {
      setVersion(updated.version);
      setCurrentStatus(updated.status);
      setSelectedStatus(updated.status);

      toast.success("Status atualizado com sucesso!");

      await refreshQueries();
    },

    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setConflict(true);
      }
    },
  });

  const isBusy = mutation.isPending || statusMutation.isPending || reloading;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (conflict || isBusy) return;

    const payload: UpdateIncidentPayload = {
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
      severity: values.severity,
      truck_id: values.truck_id.trim() || null,
      location: values.location.trim() || null,
      version,
    };

    mutation.mutate(payload);
  }

  function handleStatusUpdate() {
    if (conflict || isBusy || selectedStatus === currentStatus) {
      return;
    }

    statusMutation.mutate({
      status: selectedStatus,
      version,
    });
  }

  async function reloadIncident() {
    if (isBusy) return;

    setReloading(true);
    setReloadError("");

    try {
      const latest = await getIncident(incident.id);

      // Atualiza os campos com os dados mais recentes.
      setValues(toFormValues(latest));

      // Atualiza a versão utilizada no PATCH.
      setVersion(latest.version);

      // Sincroniza o status.
      setCurrentStatus(latest.status);
      setSelectedStatus(latest.status);

      // Limpa os erros anteriores.
      setConflict(false);
      mutation.reset();
      statusMutation.reset();

      await refreshQueries();
    } catch (error) {
      setReloadError(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar os dados atualizados.",
      );
    } finally {
      setReloading(false);
    }
  }

  const genericError =
    mutation.isError && !conflict
      ? mutation.error instanceof ApiError
        ? mutation.error.message
        : "Não foi possível atualizar o incidente."
      : null;

  const statusError =
    statusMutation.isError && !conflict
      ? statusMutation.error instanceof ApiError
        ? statusMutation.error.message
        : "Não foi possível atualizar o status."
      : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-6">
      <div className="flex min-h-full items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-incident-title"
          className="w-full max-w-4xl rounded-2xl bg-white p-5 shadow-xl"
        >
          {/* Cabeçalho */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2
                id="edit-incident-title"
                className="text-xl font-bold text-slate-900"
              >
                Editar incidente #{incident.id}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Versão atual: {version}
              </p>
            </div>

            <button
              type="button"
              aria-label="Fechar edição"
              onClick={onClose}
              disabled={isBusy}
              className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campos gerais */}
            <IncidentForm
              values={values}
              onChange={setValues}
              disabled={isBusy}
            />

            {/* Alteração de status */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Status do incidente
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Status atual: {currentStatus}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                O status é salvo separadamente dos demais campos.
              </p>

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <label className="flex min-w-52 flex-1 flex-col gap-2 text-sm">
                  Novo status
                  <select
                    value={selectedStatus}
                    disabled={isBusy || conflict}
                    onChange={(event) => {
                      setSelectedStatus(event.target.value as IncidentStatus);
                      statusMutation.reset();
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  disabled={
                    isBusy || conflict || selectedStatus === currentStatus
                  }
                  onClick={handleStatusUpdate}
                  className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {statusMutation.isPending && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}

                  {statusMutation.isPending
                    ? "Atualizando..."
                    : "Atualizar status"}
                </button>
              </div>

              {statusError && (
                <p role="alert" className="mt-3 text-sm text-red-700">
                  {statusError}
                </p>
              )}
            </div>

            {/* Conflito de concorrência */}
            {conflict && (
              <div
                role="alert"
                className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="shrink-0" />

                  <p>
                    Este incidente foi modificado por outro analista. A
                    alteração que gerou o conflito não foi salva. Atualize os
                    dados antes de tentar novamente.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void reloadIncident()}
                  disabled={isBusy}
                  className="mt-3 rounded-lg bg-amber-900 px-4 py-2 font-medium text-white disabled:opacity-60"
                >
                  {reloading ? "Atualizando..." : "Recarregar dados recentes"}
                </button>

                <p className="mt-2 text-xs">
                  Atenção: recarregar substituirá os valores preenchidos neste
                  formulário pelos dados atuais do servidor.
                </p>
              </div>
            )}

            {/* Erros gerais */}
            {(genericError || reloadError) && (
              <div
                role="alert"
                className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle size={18} className="shrink-0" />

                <span>{genericError || reloadError}</span>
              </div>
            )}

            {/* Ações */}
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={isBusy}
                className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isBusy || conflict}
                className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
              >
                {mutation.isPending && (
                  <LoaderCircle size={16} className="animate-spin" />
                )}

                {mutation.isPending ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
